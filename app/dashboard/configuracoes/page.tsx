"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function ConfiguracoesPage() {
  const [loading, setLoading] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [sucesso, setSucesso] = useState(false);
  const [erro, setErro] = useState("");
  const [barbershopId, setBarbershopId] = useState("");
  const [form, setForm] = useState({
    nome: "",
    slug: "",
    telefone: "",
    endereco: "",
    descricao: "",
    pagarme_public_key: "",
    pagarme_secret_key: "",
  });
  const [mostrarSecretKey, setMostrarSecretKey] = useState(false);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("barbershops")
      .select("*")
      .eq("email", user.email)
      .single();

    if (data) {
      setBarbershopId(data.id);
      setForm({
        nome: data.nome || "",
        slug: data.slug || "",
        telefone: data.telefone || "",
        endereco: data.endereco || "",
        descricao: data.descricao || "",
        pagarme_public_key: data.pagarme_public_key || "",
        pagarme_secret_key: data.pagarme_secret_key || "",
      });
    }
    setCarregando(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === "slug") {
      setForm({ ...form, slug: value.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/--+/g, "-") });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErro("");
    setSucesso(false);

    try {
      const { error } = await supabase
        .from("barbershops")
        .update({
          nome: form.nome,
          slug: form.slug,
          telefone: form.telefone,
          endereco: form.endereco,
          descricao: form.descricao,
          pagarme_public_key: form.pagarme_public_key,
          pagarme_secret_key: form.pagarme_secret_key,
        })
        .eq("id", barbershopId);

      if (error) throw error;
      setSucesso(true);
      setTimeout(() => setSucesso(false), 3000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro ao salvar";
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
          <Link href="/dashboard/planos" className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">Planos</Link>
          <Link href="/dashboard/meu-plano" className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">Meu Plano</Link>
          <Link href="/dashboard/configuracoes" className="flex items-center gap-3 px-4 py-3 rounded-lg bg-[#D4AF37]/10 text-[#D4AF37] font-medium">Configurações</Link>
        </nav>
      </aside>

      <main className="flex-1 p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Configurações</h1>
          <p className="text-gray-400 mt-1">Dados da sua barbearia</p>
        </div>

        <div className="max-w-2xl">
          {sucesso && (
            <div className="bg-green-500/10 border border-green-500/30 text-green-400 rounded-lg px-4 py-3 mb-6 text-sm">
              Alterações salvas com sucesso!
            </div>
          )}
          {erro && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-4 py-3 mb-6 text-sm">
              {erro}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-6 space-y-5">
              <h2 className="text-white font-semibold">Informações da barbearia</h2>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Nome da barbearia</label>
                <input type="text" name="nome" value={form.nome} onChange={handleChange}
                  className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#D4AF37]"
                  required />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Link público (slug)</label>
                <div className="flex items-center">
                  <span className="bg-[#111] border border-r-0 border-gray-700 rounded-l-lg px-4 py-3 text-gray-500 text-sm">
                    barberpass-vert.vercel.app/
                  </span>
                  <input type="text" name="slug" value={form.slug} onChange={handleChange}
                    className="flex-1 bg-[#0a0a0a] border border-gray-700 rounded-r-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#D4AF37]"
                    required />
                </div>
                <p className="text-gray-600 text-xs mt-1">Apenas letras minúsculas, números e hífens</p>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Telefone / WhatsApp</label>
                <input type="text" name="telefone" value={form.telefone} onChange={handleChange}
                  className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#D4AF37]"
                  placeholder="(11) 99999-9999" />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Endereço</label>
                <input type="text" name="endereco" value={form.endereco} onChange={handleChange}
                  className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#D4AF37]"
                  placeholder="Rua, número, bairro, cidade" />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Descrição (aparece na página pública)</label>
                <textarea name="descricao" value={form.descricao} onChange={handleChange}
                  className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#D4AF37] resize-none"
                  rows={3} placeholder="Ex: A melhor barbearia do bairro..." />
              </div>
            </div>

            <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-6 space-y-5">
              <div>
                <h2 className="text-white font-semibold">Integração Asaas</h2>
                <p className="text-gray-500 text-sm mt-1">
                  Conecte sua conta Asaas para receber os pagamentos dos seus clientes direto na sua conta.
                  Acesse <span className="text-[#D4AF37]">app.asaas.com</span> → Configurações → Chaves de API → Gerar chave.
                </p>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Chave de API Asaas</label>
                <div className="relative">
                  <input type={mostrarSecretKey ? "text" : "password"} name="pagarme_secret_key" value={form.pagarme_secret_key} onChange={handleChange}
                    className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-3 pr-20 text-white placeholder-gray-600 focus:outline-none focus:border-[#D4AF37] font-mono text-sm"
                    placeholder="$aact_prod_..." />
                  <button type="button" onClick={() => setMostrarSecretKey(!mostrarSecretKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 text-xs">
                    {mostrarSecretKey ? "Ocultar" : "Mostrar"}
                  </button>
                </div>
              </div>

              {form.pagarme_secret_key ? (
                <div className="flex items-center gap-2 text-green-400 text-sm">
                  <span>✓</span> Chave configurada — pagamentos vão para sua conta Asaas
                </div>
              ) : (
                <div className="flex items-center gap-2 text-yellow-500 text-sm">
                  <span>⚠</span> Sem chave configurada — pagamentos desativados
                </div>
              )}
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-[#D4AF37] text-black font-bold py-3 rounded-lg hover:bg-[#B8960C] transition-colors disabled:opacity-60">
              {loading ? "Salvando..." : "Salvar alterações"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
