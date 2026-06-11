"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function NovoPlanoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [beneficio, setBeneficio] = useState("");
  const [form, setForm] = useState({
    nome: "",
    descricao: "",
    preco: "",
    beneficios: [] as string[],
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const adicionarBeneficio = () => {
    if (beneficio.trim()) {
      setForm({ ...form, beneficios: [...form.beneficios, beneficio.trim()] });
      setBeneficio("");
    }
  };

  const removerBeneficio = (index: number) => {
    setForm({ ...form, beneficios: form.beneficios.filter((_, i) => i !== index) });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErro("");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data: barbershop } = await supabase
        .from("barbershops")
        .select("id")
        .eq("email", user.email)
        .single();

      if (!barbershop) throw new Error("Barbearia não encontrada");

      const { error } = await supabase.from("subscription_plans").insert({
        barbershop_id: barbershop.id,
        nome: form.nome,
        descricao: form.descricao,
        preco: parseFloat(form.preco),
        beneficios: form.beneficios,
        ativo: true,
      });

      if (error) throw error;

      router.push("/dashboard/planos");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro ao criar plano";
      setErro(message);
    } finally {
      setLoading(false);
    }
  };

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
          <Link href="/dashboard/assinantes" className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">Assinantes</Link>
          <Link href="/dashboard/planos" className="flex items-center gap-3 px-4 py-3 rounded-lg bg-[#D4AF37]/10 text-[#D4AF37] font-medium">Planos</Link>
          <Link href="/dashboard/configuracoes" className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">Configurações</Link>
        </nav>
      </aside>

      <main className="flex-1 p-8">
        <div className="mb-8">
          <Link href="/dashboard/planos" className="text-gray-400 hover:text-white text-sm mb-4 inline-block">
            ← Voltar para planos
          </Link>
          <h1 className="text-2xl font-bold text-white">Criar novo plano</h1>
          <p className="text-gray-400 mt-1">Configure os detalhes do plano de assinatura</p>
        </div>

        <div className="max-w-2xl">
          {erro && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-4 py-3 mb-6 text-sm">
              {erro}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-6 space-y-5">
              <h2 className="text-white font-semibold">Informações do plano</h2>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Nome do plano</label>
                <input
                  type="text"
                  name="nome"
                  value={form.nome}
                  onChange={handleChange}
                  className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#D4AF37]"
                  placeholder="Ex: Corte Mensal, VIP Ilimitado..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Descrição (opcional)</label>
                <textarea
                  name="descricao"
                  value={form.descricao}
                  onChange={handleChange}
                  className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#D4AF37] resize-none"
                  placeholder="Descreva o que está incluído neste plano..."
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Preço mensal (R$)</label>
                <input
                  type="number"
                  name="preco"
                  value={form.preco}
                  onChange={handleChange}
                  className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#D4AF37]"
                  placeholder="80.00"
                  min="1"
                  step="0.01"
                  required
                />
              </div>
            </div>

            <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-6 space-y-4">
              <h2 className="text-white font-semibold">Benefícios do plano</h2>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={beneficio}
                  onChange={(e) => setBeneficio(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), adicionarBeneficio())}
                  className="flex-1 bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#D4AF37]"
                  placeholder="Ex: 1 corte por mês..."
                />
                <button
                  type="button"
                  onClick={adicionarBeneficio}
                  className="bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] px-4 py-3 rounded-lg hover:bg-[#D4AF37]/20 transition-colors"
                >
                  <Plus size={18} />
                </button>
              </div>

              {form.beneficios.length > 0 && (
                <ul className="space-y-2">
                  {form.beneficios.map((b, i) => (
                    <li key={i} className="flex items-center justify-between bg-[#0a0a0a] border border-gray-800 rounded-lg px-4 py-2">
                      <span className="text-gray-300 text-sm flex items-center gap-2">
                        <span className="text-[#D4AF37]">✓</span> {b}
                      </span>
                      <button type="button" onClick={() => removerBeneficio(i)} className="text-gray-600 hover:text-red-400 transition-colors">
                        <X size={16} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {form.beneficios.length === 0 && (
                <p className="text-gray-600 text-sm">Nenhum benefício adicionado ainda.</p>
              )}
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-[#D4AF37] text-black font-bold py-3 rounded-lg hover:bg-[#B8960C] transition-colors disabled:opacity-60"
              >
                {loading ? "Criando plano..." : "Criar plano"}
              </button>
              <Link
                href="/dashboard/planos"
                className="px-6 py-3 border border-gray-700 text-gray-400 rounded-lg hover:border-gray-500 transition-colors text-center"
              >
                Cancelar
              </Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
