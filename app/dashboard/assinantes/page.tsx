"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Scissors, Users, TrendingUp, DollarSign, Settings, LogOut, Undo2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Assinante = {
  id: string;
  customer_id: string;
  nome: string;
  email: string;
  telefone: string;
  status: string;
  created_at: string;
  plano_nome: string;
  cortes_mes: number;
  limite_cortes: number;
  ultimo_checkin_id: string | null;
};

const statusColor: Record<string, string> = {
  ativo: "bg-green-400/10 text-green-400",
  inadimplente: "bg-red-400/10 text-red-400",
  cancelado: "bg-gray-700 text-gray-400",
};

export default function AssinantesPage() {
  const [assinantes, setAssinantes] = useState<Assinante[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [registrando, setRegistrando] = useState<string | null>(null);
  const [barbershopId, setBarbershopId] = useState<string | null>(null);

  useEffect(() => {
    carregarAssinantes();
  }, []);

  const carregarAssinantes = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: barbershop } = await supabase
      .from("barbershops")
      .select("id")
      .eq("email", user.email)
      .single();

    if (!barbershop) return;
    setBarbershopId(barbershop.id);

    const { data } = await supabase
      .from("subscriptions")
      .select(`
        id,
        status,
        created_at,
        customers!inner (id, nome, email, telefone, barbershop_id),
        subscription_plans (nome, limite_cortes)
      `)
      .eq("customers.barbershop_id", barbershop.id)
      .order("created_at", { ascending: false });

    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);

    const { data: checkins } = await supabase
      .from("checkins")
      .select("id, customer_id, created_at")
      .eq("barbershop_id", barbershop.id)
      .gte("created_at", inicioMes.toISOString())
      .order("created_at", { ascending: false });

    const contagemCheckins: Record<string, number> = {};
    const ultimoCheckin: Record<string, string> = {};
    (checkins || []).forEach((c: { id: string; customer_id: string }) => {
      contagemCheckins[c.customer_id] = (contagemCheckins[c.customer_id] || 0) + 1;
      if (!ultimoCheckin[c.customer_id]) ultimoCheckin[c.customer_id] = c.id;
    });

    const lista = (data || [])
      .filter((s: any) => s.customers)
      .map((s: any) => ({
        id: s.id,
        customer_id: s.customers.id,
        nome: s.customers.nome,
        email: s.customers.email,
        telefone: s.customers.telefone,
        status: s.status,
        created_at: new Date(s.created_at).toLocaleDateString("pt-BR"),
        plano_nome: s.subscription_plans?.nome || "—",
        limite_cortes: s.subscription_plans?.limite_cortes || 0,
        cortes_mes: contagemCheckins[s.customers.id] || 0,
        ultimo_checkin_id: ultimoCheckin[s.customers.id] || null,
      }));

    setAssinantes(lista);
    setLoading(false);
  };

  const registrarCorte = async (assinante: Assinante) => {
    if (!barbershopId) return;
    if (assinante.limite_cortes > 0 && assinante.cortes_mes >= assinante.limite_cortes) {
      alert(`${assinante.nome} já usou todos os ${assinante.limite_cortes} cortes do mês!`);
      return;
    }
    setRegistrando(assinante.id);
    await supabase.from("checkins").insert({
      customer_id: assinante.customer_id,
      barbershop_id: barbershopId,
    });
    await carregarAssinantes();
    setRegistrando(null);
  };

  const desfazerCorte = async (assinante: Assinante) => {
    if (!assinante.ultimo_checkin_id) return;
    setRegistrando(assinante.id);
    await supabase.from("checkins").delete().eq("id", assinante.ultimo_checkin_id);
    await carregarAssinantes();
    setRegistrando(null);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const assinantesFiltrados = assinantes.filter(
    (a) =>
      a.nome.toLowerCase().includes(busca.toLowerCase()) ||
      a.email.toLowerCase().includes(busca.toLowerCase())
  );

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
          <Link href="/dashboard/assinantes" className="flex items-center gap-3 px-4 py-3 rounded-lg bg-[#D4AF37]/10 text-[#D4AF37] font-medium">
            <Users size={18} /> Assinantes
          </Link>
          <Link href="/dashboard/planos" className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">
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
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Assinantes</h1>
          <p className="text-gray-400 mt-1">Gerencie todos os clientes da sua barbearia</p>
        </div>

        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por nome ou email..."
              className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#D4AF37]"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-gray-400 text-center py-12">Carregando assinantes...</div>
        ) : assinantesFiltrados.length === 0 ? (
          <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-12 text-center">
            <p className="text-gray-400">
              {busca ? "Nenhum assinante encontrado." : "Nenhum assinante ainda. Compartilhe seu link público para captar clientes!"}
            </p>
          </div>
        ) : (
          <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">Nome</th>
                  <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">Plano</th>
                  <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">Status</th>
                  <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">Cortes este mês</th>
                  <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">WhatsApp</th>
                  <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">Ação</th>
                </tr>
              </thead>
              <tbody>
                {assinantesFiltrados.map((a) => (
                  <tr key={a.id} className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-white font-medium">{a.nome}</p>
                      <p className="text-gray-500 text-sm">{a.email}</p>
                    </td>
                    <td className="px-6 py-4 text-gray-300">{a.plano_nome}</td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-3 py-1 rounded-full capitalize ${statusColor[a.status] || statusColor.cancelado}`}>
                        {a.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Scissors size={14} className={a.limite_cortes > 0 && a.cortes_mes >= a.limite_cortes ? "text-red-400" : "text-[#D4AF37]"} />
                        <span className={`font-bold ${a.limite_cortes > 0 && a.cortes_mes >= a.limite_cortes ? "text-red-400" : "text-white"}`}>
                          {a.cortes_mes}
                        </span>
                        {a.limite_cortes > 0 && (
                          <span className="text-gray-500 text-sm">/ {a.limite_cortes}</span>
                        )}
                        {a.limite_cortes > 0 && a.cortes_mes >= a.limite_cortes && (
                          <span className="text-xs bg-red-400/10 text-red-400 px-2 py-0.5 rounded-full">Limite atingido</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-400 text-sm">{a.telefone}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => registrarCorte(a)}
                          disabled={registrando === a.id || (a.limite_cortes > 0 && a.cortes_mes >= a.limite_cortes)}
                          className="flex items-center gap-2 bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] text-sm px-3 py-2 rounded-lg hover:bg-[#D4AF37]/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <Scissors size={14} />
                          {registrando === a.id ? "..." : "Registrar"}
                        </button>
                        {a.cortes_mes > 0 && (
                          <button
                            onClick={() => desfazerCorte(a)}
                            disabled={registrando === a.id}
                            className="text-gray-500 text-sm px-3 py-2 rounded-lg hover:bg-gray-800 hover:text-red-400 transition-colors disabled:opacity-30"
                            title="Desfazer último corte"
                          >
                            <Undo2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
