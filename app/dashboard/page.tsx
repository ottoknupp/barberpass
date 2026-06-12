"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Scissors, Users, DollarSign, TrendingUp, AlertCircle, Plus } from "lucide-react";
import { supabase } from "@/lib/supabase";
import Sidebar from "@/components/Sidebar";

type Stats = {
  ativos: number;
  mrr: number;
  novosMes: number;
  inadimplentes: number;
};

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({ ativos: 0, mrr: 0, novosMes: 0, inadimplentes: 0 });
  const [slug, setSlug] = useState("");
  const [nomeBarbearia, setNomeBarbearia] = useState("");
  const [copiado, setCopiado] = useState(false);
  const [temPlanos, setTemPlanos] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: barbershop } = await supabase
      .from("barbershops")
      .select("id, nome, slug")
      .eq("email", user.email)
      .single();

    if (!barbershop) return;
    setSlug(barbershop.slug || "");
    setNomeBarbearia(barbershop.nome || "");

    const { data: planos } = await supabase
      .from("subscription_plans")
      .select("id")
      .eq("barbershop_id", barbershop.id);

    setTemPlanos((planos || []).length > 0);

    const { data: subscriptions } = await supabase
      .from("subscriptions")
      .select(`id, status, created_at, customers!inner(barbershop_id), subscription_plans(preco)`)
      .eq("customers.barbershop_id", barbershop.id);

    const lista = subscriptions || [];
    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);

    const ativos = lista.filter((s: any) => s.status === "ativo");
    const inadimplentes = lista.filter((s: any) => s.status === "inadimplente").length;
    const novosMes = ativos.filter((s: any) => new Date(s.created_at) >= inicioMes).length;
    const mrr = ativos.reduce((acc: number, s: any) => acc + (s.subscription_plans?.preco || 0), 0);

    setStats({ ativos: ativos.length, mrr, novosMes, inadimplentes });
    setLoading(false);
  };

  const copiarLink = () => {
    const link = `${window.location.origin}/${slug}`;
    navigator.clipboard.writeText(link);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] md:flex">
      <Sidebar ativo="/dashboard" />

      <main className="flex-1 p-4 pt-20 md:p-8 md:pt-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">{nomeBarbearia || "Dashboard"}</h1>
            <p className="text-gray-400 mt-1">Bem-vindo ao seu painel de controle</p>
          </div>
          <Link href="/dashboard/planos/novo"
            className="flex items-center gap-2 bg-[#D4AF37] text-black font-semibold px-4 py-2 rounded-lg hover:bg-[#B8960C] transition-colors">
            <Plus size={18} /> Novo plano
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-gray-400 text-sm">Assinantes ativos</p>
              <Users className="text-[#D4AF37]" size={20} />
            </div>
            <p className="text-3xl font-bold text-white">{loading ? "—" : stats.ativos}</p>
          </div>
          <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-gray-400 text-sm">Receita mensal (MRR)</p>
              <DollarSign className="text-green-400" size={20} />
            </div>
            <p className="text-3xl font-bold text-white">
              {loading ? "—" : `R$${stats.mrr.toFixed(2).replace(".", ",")}`}
            </p>
          </div>
          <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-gray-400 text-sm">Novos este mês</p>
              <TrendingUp className="text-blue-400" size={20} />
            </div>
            <p className="text-3xl font-bold text-white">{loading ? "—" : stats.novosMes}</p>
          </div>
          <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-gray-400 text-sm">Inadimplentes</p>
              <AlertCircle className="text-red-400" size={20} />
            </div>
            <p className="text-3xl font-bold text-white">{loading ? "—" : stats.inadimplentes}</p>
          </div>
        </div>

        {slug && (
          <div className="mb-6 bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-xl p-6">
            <h3 className="text-[#D4AF37] font-semibold mb-1">Seu link de cadastro</h3>
            <p className="text-gray-400 text-sm mb-3">Compartilhe com seus clientes para que eles possam assinar:</p>
            <div className="flex items-center gap-3">
              <code className="flex-1 bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-2 text-gray-300 text-sm truncate">
                {typeof window !== "undefined" ? `${window.location.origin}/${slug}` : `.../${slug}`}
              </code>
              <button onClick={copiarLink}
                className="text-[#D4AF37] border border-[#D4AF37]/40 px-4 py-2 rounded-lg hover:bg-[#D4AF37]/10 transition-colors text-sm whitespace-nowrap">
                {copiado ? "Copiado!" : "Copiar"}
              </button>
            </div>
          </div>
        )}

        {!loading && !temPlanos && (
          <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-12 text-center">
            <Scissors className="text-[#D4AF37] mx-auto mb-4" size={48} />
            <h2 className="text-xl font-bold text-white mb-2">Comece criando um plano</h2>
            <p className="text-gray-400 mb-6">Crie os planos de assinatura da sua barbearia e compartilhe o link com seus clientes.</p>
            <Link href="/dashboard/planos/novo"
              className="inline-flex items-center gap-2 bg-[#D4AF37] text-black font-semibold px-6 py-3 rounded-lg hover:bg-[#B8960C] transition-colors">
              <Plus size={18} /> Criar primeiro plano
            </Link>
          </div>
        )}

        {!loading && temPlanos && stats.ativos === 0 && (
          <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-8 text-center">
            <p className="text-gray-400">Nenhum assinante ainda. Compartilhe seu link acima para captar clientes!</p>
          </div>
        )}
      </main>
    </div>
  );
}
