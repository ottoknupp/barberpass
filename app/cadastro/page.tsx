"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Scissors, MailCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function CadastroPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [emailEnviado, setEmailEnviado] = useState(false);
  const [form, setForm] = useState({
    nomeBarbearia: "",
    nomeResponsavel: "",
    email: "",
    telefone: "",
    senha: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const gerarSlug = (nome: string) =>
    nome.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErro("");

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.senha,
        options: {
          emailRedirectTo: `${window.location.origin}/login?confirmado=1`,
        },
      });

      if (authError) throw authError;

      // Com confirmação de email ativa, email repetido volta sem identities
      if (authData.user && authData.user.identities?.length === 0) {
        throw new Error("Este email já está cadastrado. Faça login.");
      }

      const slug = gerarSlug(form.nomeBarbearia);

      const { error: dbError } = await supabase.from("barbershops").insert({
        nome: form.nomeBarbearia,
        nome_responsavel: form.nomeResponsavel,
        email: form.email,
        telefone: form.telefone,
        slug,
      });

      if (dbError) throw dbError;

      if (authData.session) {
        // Confirmação de email desativada no Supabase: entra direto
        router.push("/dashboard");
      } else {
        setEmailEnviado(true);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro ao criar conta";
      setErro(message);
    } finally {
      setLoading(false);
    }
  };

  if (emailEnviado) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-[#D4AF37]/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <MailCheck className="text-[#D4AF37]" size={40} />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">Confirme seu email</h1>
          <p className="text-gray-400 mb-2">
            Enviamos um link de confirmação para{" "}
            <span className="text-white font-semibold">{form.email}</span>
          </p>
          <p className="text-gray-500 text-sm mb-8">
            Clique no link do email para ativar sua conta. Confira também a caixa de spam.
          </p>
          <Link
            href="/login"
            className="inline-block bg-[#D4AF37] text-black font-bold px-8 py-3 rounded-lg hover:bg-[#B8960C] transition-colors"
          >
            Ir para o login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <Scissors className="text-[#D4AF37]" size={28} />
            <span className="text-2xl font-bold text-white">BarberPass</span>
          </Link>
          <h1 className="text-2xl font-bold text-white">Cadastre sua barbearia</h1>
          <p className="text-gray-400 mt-2">Grátis até 10 assinantes, sem cartão de crédito</p>
        </div>

        <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-8">
          {erro && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-4 py-3 mb-5 text-sm">
              {erro}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Nome da barbearia</label>
              <input
                type="text"
                name="nomeBarbearia"
                value={form.nomeBarbearia}
                onChange={handleChange}
                className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#D4AF37]"
                placeholder="Barbearia do João"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Seu nome</label>
              <input
                type="text"
                name="nomeResponsavel"
                value={form.nomeResponsavel}
                onChange={handleChange}
                className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#D4AF37]"
                placeholder="João Silva"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Email</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#D4AF37]"
                placeholder="joao@barbearia.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Telefone / WhatsApp</label>
              <input
                type="tel"
                name="telefone"
                value={form.telefone}
                onChange={handleChange}
                className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#D4AF37]"
                placeholder="(11) 99999-9999"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Senha</label>
              <input
                type="password"
                name="senha"
                value={form.senha}
                onChange={handleChange}
                className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#D4AF37]"
                placeholder="Mínimo 6 caracteres"
                minLength={6}
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#D4AF37] text-black font-bold py-3 rounded-lg hover:bg-[#B8960C] transition-colors disabled:opacity-60"
            >
              {loading ? "Criando conta..." : "Criar conta grátis"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Já tem conta?{" "}
            <Link href="/login" className="text-[#D4AF37] hover:underline">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
