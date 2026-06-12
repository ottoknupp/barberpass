import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const ASAAS_BASE = "https://api.asaas.com/v3";

export async function POST(req: NextRequest) {
  try {
    const { subscriptionId } = await req.json();

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: sub } = await supabase
      .from("subscriptions")
      .select("id, pagarme_subscription_id, customers (barbershop_id)")
      .eq("id", subscriptionId)
      .single();

    if (!sub) {
      return NextResponse.json({ error: "Assinatura não encontrada." }, { status: 404 });
    }

    // Cancela a cobrança recorrente no Asaas (se houver vínculo)
    const asaasSubId = sub.pagarme_subscription_id;
    const barbershopId = (sub.customers as any)?.barbershop_id;

    if (asaasSubId && barbershopId) {
      const { data: barbershop } = await supabase
        .from("barbershops")
        .select("pagarme_secret_key")
        .eq("id", barbershopId)
        .single();

      if (barbershop?.pagarme_secret_key) {
        const res = await fetch(`${ASAAS_BASE}/subscriptions/${asaasSubId}`, {
          method: "DELETE",
          headers: { access_token: barbershop.pagarme_secret_key },
        });
        // 404 no Asaas = já cancelada lá; segue o fluxo e marca no banco
        if (!res.ok && res.status !== 404) {
          const body = await res.json().catch(() => null);
          const msg = body?.errors?.[0]?.description || "Erro ao cancelar cobrança no Asaas";
          return NextResponse.json({ error: msg }, { status: 400 });
        }
      }
    }

    const { error } = await supabase
      .from("subscriptions")
      .update({ status: "cancelado" })
      .eq("id", subscriptionId);

    if (error) {
      return NextResponse.json({ error: "Erro ao atualizar assinatura." }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro interno no servidor" }, { status: 500 });
  }
}
