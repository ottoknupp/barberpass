import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { customerData, planData, cardToken, barbershopId } = body;

    // Buscar chaves do Pagar.me da barbearia
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: barbershop } = await supabase
      .from("barbershops")
      .select("pagarme_secret_key")
      .eq("id", barbershopId)
      .single();

    if (!barbershop?.pagarme_secret_key) {
      return NextResponse.json({ error: "Barbearia sem chaves do Pagar.me configuradas." }, { status: 400 });
    }

    const secretKey = barbershop.pagarme_secret_key;
    const authHeader = "Basic " + Buffer.from(secretKey + ":").toString("base64");

    // 1. Criar cliente no Pagar.me
    const customerRes = await fetch("https://api.pagar.me/core/v5/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: authHeader },
      body: JSON.stringify({
        name: customerData.nome,
        email: customerData.email,
        type: "individual",
        document: customerData.cpf.replace(/\D/g, ""),
        document_type: "CPF",
        phones: {
          mobile_phone: {
            country_code: "55",
            area_code: customerData.telefone.replace(/\D/g, "").substring(0, 2),
            number: customerData.telefone.replace(/\D/g, "").substring(2),
          },
        },
      }),
    });

    const customer = await customerRes.json();
    if (!customerRes.ok) {
      return NextResponse.json({ error: customer.message || "Erro ao criar cliente" }, { status: 400 });
    }

    // 2. Criar assinatura com card_token
    const precoEmCentavos = Math.round(planData.preco * 100);

    const subscriptionRes = await fetch("https://api.pagar.me/core/v5/subscriptions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: authHeader },
      body: JSON.stringify({
        customer_id: customer.id,
        payment_method: "credit_card",
        interval: "month",
        interval_count: 1,
        billing_type: "prepaid",
        items: [
          {
            description: planData.nome,
            quantity: 1,
            pricing_scheme: { price: precoEmCentavos },
          },
        ],
        card_token: cardToken,
      }),
    });

    const subscription = await subscriptionRes.json();
    if (!subscriptionRes.ok) {
      const errMsg = subscription.errors
        ? JSON.stringify(subscription.errors)
        : subscription.message || "Erro ao criar assinatura";
      return NextResponse.json({ error: errMsg }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      pagarme_customer_id: customer.id,
      pagarme_subscription_id: subscription.id,
      status: subscription.status,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro interno no servidor" }, { status: 500 });
  }
}
