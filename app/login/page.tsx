"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Scissors } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErro("");

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setErro("Email ou senha incorretos.");
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <Scissors className="text-[#D4AF37]" size={28} />
            <span className="text-2xl font-bold text-white">BarberPass</span>
          </Link>
          <h1 className="text-2xl font-bold text-white">Entrar na sua conta</h1>
          <p className="text-gray-400 mt-2">Acesse o painel da sua barbearia</p>
        </div>

        <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-8">
          {erro && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-4 py-3 mb-5 text-sm">
              {erro}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#D4AF37]"
                placeholder="seu@email.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Senha</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#D4AF37]"
                placeholder="••••••••"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#D4AF37] text-black font-bold py-3 rounded-lg hover:bg-[#B8960C] transition-colors disabled:opacity-60"
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>

          <div className="mt-6 text-center space-y-2">
            <p className="text-sm text-gray-500">
              Não tem conta?{" "}
              <Link href="/cadastro" className="text-[#D4AF37] hover:underline">
                Cadastre sua barbearia
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
