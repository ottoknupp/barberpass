"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Scissors, Users, TrendingUp, DollarSign, Settings, LogOut, CheckCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { PLANOS, getPlanoAtual, type PlanoBarberPass } from "@/lib/planos-barberpass";

export default function MeuPlanoPage() {
  const [planoAtual, setPlanoAtual] = useState<PlanoBarberPass>("gratis");
  const [totalAssinantes, setTotalAssinantes] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: barbershop } = await supabase
      .from("barbershops")
      .select("id, plano")
      .eq("email", user.email)
      .single();

    if (!barbershop) return;

    const { count } = await supabase
      .from("subscriptions")
      .select("id", { count: "exact", head: true })
      .eq("customers.barbershop_id", barbershop.id)
      .eq("status", "ativo");

    const total = count || 0;
    setTotalAssinantes(total);
    setPlanoAtual((barbershop.plano || getPlanoAtual(total)) as PlanoBarberPass);
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const planosOrdem: PlanoBarberPass[] = ["gratis", "crescimento", "profissional", "premium"];

  const limiteAtual = PLANOS[planoAtual].limite;
  const porcentagem = limiteAtual === Infinity ? 0 : Math.min((totalAssinantes / limiteAtual) * 100, 100);
  const proximoPlano = planosOrdem[planosOrdem.indexOf(planoAtual) + 1];

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex">
      <aside className="w-64 bg-[#1a1a1a] border-r border-gray-800 flex flex-col">
        <div className="p-6 border-b border-gray-800">
          <Link href="/" className="flex items-center gap-2">
            <Scissors className="text-[#D4AF37]" size={20} />
            <span className="text-lg font-bold text-white">BarberPass</span>
          </Link>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">
            <TrendingUp size={18} /> Dashboard
          </Link>
          <Link href="/dashboard/assinantes" className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">
            <Users size={18} /> Assinantes
          </Link>
          <Link href="/dashboard/planos" className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">
            <DollarSign size={18} /> Planos
          </Link>
          <Link href="/dashboard/meu-plano" className="flex items-center gap-3 px-4 py-3 rounded-lg bg-[#D4AF37]/10 text-[#D4AF37] font-medium">
            <TrendingUp size={18} /> Meu Plano
          </Link>
          <Link href="/dashboard/configuracoes" className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">
            <Settings size={18} /> Configurações
          </Link>
        </nav>
        <div className="p-4 border-t border-gray-800">
          <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:text-red-400 transition-colors w-full">
            <LogOut size={18} /> Sair
          </button>
        </div>
      </aside>

      <main className="flex-1 p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Meu Plano</h1>
          <p className="text-gray-400 mt-1">Gerencie sua assinatura do BarberPass</p>
        </div>

        {loading ? (
          <p className="text-gray-400">Carregando...</p>
        ) : (
          <div className="max-w-3xl space-y-6">

            {/* Plano atual */}
            <div className="bg-[#1a1a1a] border border-[#D4AF37]/40 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-gray-400 text-sm">Plano atual</p>
                  <p className="text-2xl font-bold text-white">{PLANOS[planoAtual].nome}</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-[#D4AF37]">
                    {PLANOS[planoAtual].preco === 0 ? "Grátis" : `R$${PLANOS[planoAtual].preco}/mês`}
                  </p>
                </div>
              </div>

              {/* Barra de uso */}
              <div className="mb-2">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">Assinantes ativos</span>
                  <span className={`font-semibold ${porcentagem >= 90 ? "text-red-400" : "text-white"}`}>
                    {totalAssinantes} / {limiteAtual === Infinity ? "∞" : limiteAtual}
                  </span>
                </div>
                {limiteAtual !== Infinity && (
                  <div className="w-full bg-gray-800 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${porcentagem >= 90 ? "bg-red-400" : "bg-[#D4AF37]"}`}
                      style={{ width: `${porcentagem}%` }}
                    />
                  </div>
                )}
              </div>

              {porcentagem >= 80 && proximoPlano && (
                <p className="text-yellow-500 text-sm mt-3">
                  ⚠ Você está usando {Math.round(porcentagem)}% do seu limite. Considere fazer upgrade.
                </p>
              )}
              {limiteAtual !== Infinity && totalAssinantes >= limiteAtual && (
                <p className="text-red-400 text-sm mt-3">
                  ✕ Limite atingido — novos clientes não conseguem se cadastrar.
                </p>
              )}
            </div>

            {/* Planos disponíveis */}
            <h2 className="text-white font-semibold text-lg">Todos os planos</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {planosOrdem.map((p) => {
                const info = PLANOS[p];
                const isAtual = p === planoAtual;
                return (
                  <div
                    key={p}
                    className={`rounded-xl p-6 border ${isAtual ? "border-[#D4AF37] bg-[#D4AF37]/5" : "border-gray-800 bg-[#1a1a1a]"}`}
                  >
                    {isAtual && (
                      <span className="text-xs bg-[#D4AF37] text-black font-bold px-2 py-0.5 rounded-full mb-3 inline-block">
                        PLANO ATUAL
                      </span>
                    )}
                    <p className="text-white font-bold text-lg">{info.nome}</p>
                    <p className="text-[#D4AF37] text-2xl font-bold mt-1">
                      {info.preco === 0 ? "Grátis" : `R$${info.preco}/mês`}
                    </p>
                    <p className="text-gray-400 text-sm mt-1">
                      {info.limite === Infinity ? "Assinantes ilimitados" : `Até ${info.limite} assinantes`}
                    </p>
                    {isAtual && (
                      <div className="flex items-center gap-2 text-green-400 text-sm mt-4">
                        <CheckCircle size={14} /> Plano ativo
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <p className="text-gray-500 text-sm text-center">
              Para fazer upgrade, entre em contato: <span className="text-[#D4AF37]">suporte@barberpass.com.br</span>
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
