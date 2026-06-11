import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { customerData, planData, cardToken } = body;

    const secretKey = process.env.PAGARME_SECRET_KEY!;
    const authHeader = "Basic " + Buffer.from(secretKey + ":").toString("base64");

    // 1. Criar cliente no Pagar.me
    const customerRes = await fetch("https://api.pagar.me/core/v5/customers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
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
    console.log("Customer response:", JSON.stringify(customer));
    if (!customerRes.ok) {
      return NextResponse.json({ error: customer.message || "Erro ao criar cliente" }, { status: 400 });
    }

    // 2. Criar assinatura com card_token
    const precoEmCentavos = Math.round(planData.preco * 100);

    const subscriptionBody = {
      customer_id: customer.id,
      payment_method: "credit_card",
      interval: "month",
      interval_count: 1,
      billing_type: "prepaid",
      items: [
        {
          description: planData.nome,
          quantity: 1,
          pricing_scheme: {
            price: precoEmCentavos,
          },
        },
      ],
      card_token: cardToken,
    };

    console.log("Subscription body:", JSON.stringify(subscriptionBody));

    const subscriptionRes = await fetch("https://api.pagar.me/core/v5/subscriptions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify(subscriptionBody),
    });

    const subscription = await subscriptionRes.json();
    console.log("Subscription response:", JSON.stringify(subscription));

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
