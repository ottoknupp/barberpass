import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const ASAAS_BASE = "https://api.asaas.com/v3";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { customerData, planData, cardData, barbershopId } = body;

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
      return NextResponse.json({ error: "Barbearia sem chave Asaas configurada." }, { status: 400 });
    }

    const apiKey = barbershop.pagarme_secret_key;
    const headers = {
      "Content-Type": "application/json",
      "access_token": apiKey,
    };

    // 1. Criar cliente no Asaas
    const customerRes = await fetch(`${ASAAS_BASE}/customers`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        name: customerData.nome,
        cpfCnpj: customerData.cpf.replace(/\D/g, ""),
        email: customerData.email,
        mobilePhone: customerData.telefone.replace(/\D/g, ""),
      }),
    });

    const customer = await customerRes.json();
    if (!customerRes.ok) {
      const msg = customer.errors?.[0]?.description || customer.message || "Erro ao criar cliente";
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    // 2. Criar assinatura mensal com cartão
    const hoje = new Date();
    const nextDueDate = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}-${String(hoje.getDate()).padStart(2, "0")}`;

    const [expMonth, expYear] = cardData.validade.split("/");

    const subscriptionRes = await fetch(`${ASAAS_BASE}/subscriptions`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        customer: customer.id,
        billingType: "CREDIT_CARD",
        value: planData.preco,
        nextDueDate,
        cycle: "MONTHLY",
        description: planData.nome,
        creditCard: {
          holderName: cardData.nome,
          number: cardData.numero.replace(/\s/g, ""),
          expiryMonth: expMonth,
          expiryYear: "20" + expYear,
          ccv: cardData.cvv,
        },
        creditCardHolderInfo: {
          name: customerData.nome,
          email: customerData.email,
          cpfCnpj: customerData.cpf.replace(/\D/g, ""),
          postalCode: customerData.cep.replace(/\D/g, ""),
          addressNumber: customerData.numero_endereco,
          phone: customerData.telefone.replace(/\D/g, ""),
        },
      }),
    });

    const subscription = await subscriptionRes.json();
    if (!subscriptionRes.ok) {
      const msg = subscription.errors?.[0]?.description || subscription.message || "Erro ao criar assinatura";
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      asaas_customer_id: customer.id,
      asaas_subscription_id: subscription.id,
      status: subscription.status,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro interno no servidor" }, { status: 500 });
  }
}
