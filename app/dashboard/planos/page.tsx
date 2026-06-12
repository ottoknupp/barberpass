"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Scissors, Plus, Edit, DollarSign, ToggleLeft, ToggleRight, Users, TrendingUp, Settings, LogOut } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Plano = {
  id: string;
  nome: string;
  descricao: string;
  preco: number;
  beneficios: string[];
  ativo: boolean;
};

export default function PlanosPage() {
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarPlanos();
  }, []);

  const carregarPlanos = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: barbershop } = await supabase
      .from("barbershops")
      .select("id")
      .eq("email", user.email)
      .single();

    if (!barbershop) return;

    const { data } = await supabase
      .from("subscription_plans")
      .select("*")
      .eq("barbershop_id", barbershop.id)
      .order("created_at", { ascending: true });

    setPlanos(data || []);
    setLoading(false);
  };

  const toggleAtivo = async (plano: Plano) => {
    await supabase.from("subscription_plans").update({ ativo: !plano.ativo }).eq("id", plano.id);
    carregarPlanos();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

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
          <Link href="/dashboard/planos" className="flex items-center gap-3 px-4 py-3 rounded-lg bg-[#D4AF37]/10 text-[#D4AF37] font-medium">
            <DollarSign size={18} /> Planos
          </Link>
          <Link href="/dashboard/meu-plano" className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">
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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Planos de Assinatura</h1>
            <p className="text-gray-400 mt-1">Gerencie os planos oferecidos na sua barbearia</p>
          </div>
          <Link href="/dashboard/planos/novo"
            className="flex items-center gap-2 bg-[#D4AF37] text-black font-semibold px-4 py-2 rounded-lg hover:bg-[#B8960C] transition-colors">
            <Plus size={18} /> Novo plano
          </Link>
        </div>

        {loading ? (
          <div className="text-gray-400 text-center py-12">Carregando planos...</div>
        ) : planos.length === 0 ? (
          <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-12 text-center">
            <p className="text-gray-400 mb-4">Nenhum plano criado ainda.</p>
            <Link href="/dashboard/planos/novo"
              className="inline-flex items-center gap-2 bg-[#D4AF37] text-black font-semibold px-6 py-3 rounded-lg hover:bg-[#B8960C] transition-colors">
              <Plus size={18} /> Criar primeiro plano
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {planos.map((plano) => (
              <div key={plano.id} className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-white font-bold text-lg">{plano.nome}</h3>
                    {plano.descricao && <p className="text-gray-500 text-sm mt-1">{plano.descricao}</p>}
                    <p className="text-[#D4AF37] text-2xl font-bold mt-2">
                      R${plano.preco.toFixed(2).replace(".", ",")}
                      <span className="text-gray-500 text-sm">/mês</span>
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${plano.ativo ? "bg-green-400/10 text-green-400" : "bg-gray-700 text-gray-400"}`}>
                    {plano.ativo ? "Ativo" : "Inativo"}
                  </span>
                </div>

                {plano.beneficios && plano.beneficios.length > 0 && (
                  <ul className="space-y-2 mb-6">
                    {plano.beneficios.map((b, i) => (
                      <li key={i} className="text-gray-400 text-sm flex items-center gap-2">
                        <span className="text-[#D4AF37]">✓</span> {b}
                      </li>
                    ))}
                  </ul>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-gray-800">
                  <span className="text-gray-500 text-sm flex items-center gap-1">
                    <DollarSign size={14} /> 0 assinantes
                  </span>
                  <div className="flex gap-2">
                    <button onClick={() => toggleAtivo(plano)}
                      className="text-gray-400 hover:text-[#D4AF37] p-2 rounded-lg hover:bg-gray-800 transition-colors"
                      title={plano.ativo ? "Desativar" : "Ativar"}>
                      {plano.ativo ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                    </button>
                    <Link href={`/dashboard/planos/${plano.id}/editar`}
                      className="text-gray-400 hover:text-[#D4AF37] p-2 rounded-lg hover:bg-gray-800 transition-colors">
                      <Edit size={18} />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
