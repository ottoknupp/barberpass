"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Edit, ToggleLeft, ToggleRight, Users } from "lucide-react";
import { supabase } from "@/lib/supabase";
import Sidebar from "@/components/Sidebar";

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
  const [assinantesPorPlano, setAssinantesPorPlano] = useState<Record<string, number>>({});
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

    const lista = data || [];
    setPlanos(lista);

    if (lista.length > 0) {
      const { data: subs } = await supabase
        .from("subscriptions")
        .select("plan_id")
        .in("plan_id", lista.map((p) => p.id))
        .eq("status", "ativo");

      const contagem: Record<string, number> = {};
      (subs || []).forEach((s: { plan_id: string }) => {
        contagem[s.plan_id] = (contagem[s.plan_id] || 0) + 1;
      });
      setAssinantesPorPlano(contagem);
    }

    setLoading(false);
  };

  const toggleAtivo = async (plano: Plano) => {
    await supabase.from("subscription_plans").update({ ativo: !plano.ativo }).eq("id", plano.id);
    carregarPlanos();
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] md:flex">
      <Sidebar ativo="/dashboard/planos" />

      <main className="flex-1 p-4 pt-20 md:p-8 md:pt-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
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
                    <Users size={14} /> {assinantesPorPlano[plano.id] || 0} {(assinantesPorPlano[plano.id] || 0) === 1 ? "assinante" : "assinantes"}
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
