import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { PLANOS, type PlanoBarberPass } from "@/lib/planos-barberpass";

const ASAAS_BASE = "https://api.asaas.com/v3";

export async function POST(req: NextRequest) {
  try {
    const { barbershopId, plano, holder, card } = await req.json();

    // Preço vem do servidor (nunca do cliente) — impede pagar barato por plano caro
    const planoInfo = PLANOS[plano as PlanoBarberPass];
    if (!planoInfo || planoInfo.preco <= 0) {
      return NextResponse.json({ error: "Plano inválido para cobrança." }, { status: 400 });
    }

    // Chave Asaas do BARBERPASS (sua conta) — é aqui que cai a mensalidade
    const apiKey = process.env.BARBERPASS_ASAAS_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "BarberPass sem conta de pagamento configurada." }, { status: 500 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: barbershop } = await supabase
      .from("barbershops")
      .select("id, nome, email, telefone")
      .eq("id", barbershopId)
      .single();

    if (!barbershop) {
      return NextResponse.json({ error: "Barbearia não encontrada." }, { status: 404 });
    }

    const headers = { "Content-Type": "application/json", access_token: apiKey };
    const telefone = (barbershop.telefone || "").replace(/\D/g, "");
    const cpfCnpj = holder.cpfCnpj.replace(/\D/g, "");

    // 1. Criar a barbearia como cliente do BarberPass no Asaas
    const customerRes = await fetch(`${ASAAS_BASE}/customers`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        name: barbershop.nome,
        cpfCnpj,
        email: barbershop.email,
        mobilePhone: telefone,
      }),
    });
    const customer = await customerRes.json();
    if (!customerRes.ok) {
      const msg = customer.errors?.[0]?.description || customer.message || "Erro ao criar cliente";
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    // 2. Criar assinatura mensal recorrente
    const hoje = new Date();
    const nextDueDate = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}-${String(hoje.getDate()).padStart(2, "0")}`;
    const [expMonth, expYear] = card.validade.split("/");

    const subRes = await fetch(`${ASAAS_BASE}/subscriptions`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        customer: customer.id,
        billingType: "CREDIT_CARD",
        value: planoInfo.preco,
        nextDueDate,
        cycle: "MONTHLY",
        description: `BarberPass - Plano ${planoInfo.nome}`,
        creditCard: {
          holderName: card.nome,
          number: card.numero.replace(/\s/g, ""),
          expiryMonth: expMonth,
          expiryYear: "20" + expYear,
          ccv: card.cvv,
        },
        creditCardHolderInfo: {
          name: holder.nome,
          email: barbershop.email,
          cpfCnpj,
          postalCode: holder.cep.replace(/\D/g, ""),
          addressNumber: holder.numero,
          phone: telefone,
        },
      }),
    });
    const subscription = await subRes.json();
    if (!subRes.ok) {
      const msg = subscription.errors?.[0]?.description || subscription.message || "Erro ao criar assinatura";
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      plano,
      asaas_subscription_id: subscription.id,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro interno no servidor" }, { status: 500 });
  }
}
