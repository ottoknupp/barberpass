"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { Plus, X } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function EditarPlanoPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [beneficio, setBeneficio] = useState("");
  const [form, setForm] = useState({
    nome: "",
    descricao: "",
    preco: "",
    limite_cortes: "",
    beneficios: [] as string[],
  });

  useEffect(() => {
    carregarPlano();
  }, [id]);

  const carregarPlano = async () => {
    const { data } = await supabase
      .from("subscription_plans")
      .select("*")
      .eq("id", id)
      .single();

    if (data) {
      setForm({
        nome: data.nome,
        descricao: data.descricao || "",
        preco: data.preco.toString(),
        limite_cortes: data.limite_cortes?.toString() || "0",
        beneficios: data.beneficios || [],
      });
    }
    setCarregando(false);
  };

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
      const { error } = await supabase
        .from("subscription_plans")
        .update({
          nome: form.nome,
          descricao: form.descricao,
          preco: parseFloat(form.preco),
          limite_cortes: parseInt(form.limite_cortes) || 0,
          beneficios: form.beneficios,
        })
        .eq("id", id);

      if (error) throw error;
      router.push("/dashboard/planos");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro ao salvar plano";
      setErro(message);
    } finally {
      setLoading(false);
    }
  };

  if (carregando) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <p className="text-gray-400">Carregando...</p>
      </div>
    );
  }

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
          <h1 className="text-2xl font-bold text-white">Editar plano</h1>
          <p className="text-gray-400 mt-1">Atualize os detalhes do plano de assinatura</p>
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
                  min="1"
                  step="0.01"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Limite de cortes por mês</label>
                <input
                  type="number"
                  name="limite_cortes"
                  value={form.limite_cortes}
                  onChange={handleChange}
                  className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#D4AF37]"
                  placeholder="0 = ilimitado"
                  min="0"
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
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-[#D4AF37] text-black font-bold py-3 rounded-lg hover:bg-[#B8960C] transition-colors disabled:opacity-60"
              >
                {loading ? "Salvando..." : "Salvar alterações"}
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
