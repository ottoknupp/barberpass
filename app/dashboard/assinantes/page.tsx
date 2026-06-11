"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Assinante = {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  status: string;
  created_at: string;
  plano_nome: string;
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

    const { data } = await supabase
      .from("subscriptions")
      .select(`
        id,
        status,
        created_at,
        customers (id, nome, email, telefone),
        subscription_plans (nome)
      `)
      .eq("customers.barbershop_id", barbershop.id)
      .order("created_at", { ascending: false });

    const lista = (data || [])
      .filter((s: any) => s.customers)
      .map((s: any) => ({
        id: s.id,
        nome: s.customers.nome,
        email: s.customers.email,
        telefone: s.customers.telefone,
        status: s.status,
        created_at: new Date(s.created_at).toLocaleDateString("pt-BR"),
        plano_nome: s.subscription_plans?.nome || "—",
      }));

    setAssinantes(lista);
    setLoading(false);
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
            <span className="text-lg font-bold text-white">✂ BarberPass</span>
          </Link>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">Dashboard</Link>
          <Link href="/dashboard/assinantes" className="flex items-center gap-3 px-4 py-3 rounded-lg bg-[#D4AF37]/10 text-[#D4AF37] font-medium">Assinantes</Link>
          <Link href="/dashboard/planos" className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">Planos</Link>
          <Link href="/dashboard/configuracoes" className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">Configurações</Link>
        </nav>
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
                  <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">Desde</th>
                  <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">WhatsApp</th>
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
                    <td className="px-6 py-4 text-gray-400 text-sm">{a.created_at}</td>
                    <td className="px-6 py-4 text-gray-400 text-sm">{a.telefone}</td>
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
