"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Scissors, AlertTriangle, CheckCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function CancelarPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [nomeBarbearia, setNomeBarbearia] = useState("");
  const [barbershopId, setBarbershopId] = useState("");
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<"buscar" | "confirmar" | "cancelado">("buscar");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [email, setEmail] = useState("");
  const [assinante, setAssinante] = useState<{ nome: string; plano: string; subscriptionId: string } | null>(null);

  useEffect(() => {
    carregarBarbearia();
  }, [slug]);

  const carregarBarbearia = async () => {
    const { data } = await supabase
      .from("barbershops")
      .select("id, nome")
      .eq("slug", slug)
      .single();

    if (!data) { setNotFound(true); setLoading(false); return; }
    setBarbershopId(data.id);
    setNomeBarbearia(data.nome);
    setLoading(false);
  };

  const buscarAssinante = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    setSalvando(true);

    const { data: cliente } = await supabase
      .from("customers")
      .select("id, nome")
      .eq("email", email)
      .eq("barbershop_id", barbershopId)
      .single();

    if (!cliente) {
      setErro("Nenhuma assinatura encontrada com esse email.");
      setSalvando(false);
      return;
    }

    const { data: sub } = await supabase
      .from("subscriptions")
      .select("id, status, subscription_plans(nome)")
      .eq("customer_id", cliente.id)
      .eq("status", "ativo")
      .single();

    if (!sub) {
      setErro("Você não possui assinatura ativa nesta barbearia.");
      setSalvando(false);
      return;
    }

    setAssinante({
      nome: cliente.nome,
      plano: (sub as any).subscription_plans?.nome || "Plano",
      subscriptionId: sub.id,
    });
    setStep("confirmar");
    setSalvando(false);
  };

  const confirmarCancelamento = async () => {
    if (!assinante) return;
    setSalvando(true);
    setErro("");

    try {
      const res = await fetch("/api/cancelar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscriptionId: assinante.subscriptionId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao cancelar");

      setStep("cancelado");
    } catch {
      setErro("Erro ao cancelar. Tente novamente.");
    } finally {
      setSalvando(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <p className="text-gray-400">Carregando...</p>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <Scissors className="text-[#D4AF37] mx-auto mb-4" size={48} />
          <h1 className="text-2xl font-bold text-white mb-2">Barbearia não encontrada</h1>
          <p className="text-gray-400">O link que você acessou não é válido.</p>
        </div>
      </div>
    );
  }

  if (step === "cancelado") {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-green-400/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="text-green-400" size={40} />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">Assinatura cancelada</h1>
          <p className="text-gray-400">
            Sua assinatura na <span className="text-white">{nomeBarbearia}</span> foi cancelada com sucesso.
          </p>
          <p className="text-gray-500 text-sm mt-4">
            Se mudar de ideia, pode assinar novamente a qualquer momento.
          </p>
        </div>
      </div>
    );
  }

  if (step === "confirmar" && assinante) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Scissors className="text-[#D4AF37] mx-auto mb-3" size={32} />
            <h1 className="text-2xl font-bold text-white">{nomeBarbearia}</h1>
          </div>

          <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-red-400/10 rounded-full flex items-center justify-center">
                <AlertTriangle className="text-red-400" size={20} />
              </div>
              <div>
                <p className="text-white font-semibold">Cancelar assinatura</p>
                <p className="text-gray-400 text-sm">Esta ação não pode ser desfeita</p>
              </div>
            </div>

            <div className="bg-[#0a0a0a] border border-gray-800 rounded-lg p-4 mb-6">
              <p className="text-gray-400 text-sm">Assinante</p>
              <p className="text-white font-semibold">{assinante.nome}</p>
              <p className="text-gray-400 text-sm mt-2">Plano</p>
              <p className="text-white font-semibold">{assinante.plano}</p>
            </div>

            {erro && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-4 py-3 mb-4 text-sm">
                {erro}
              </div>
            )}

            <button
              onClick={confirmarCancelamento}
              disabled={salvando}
              className="w-full bg-red-500 text-white font-bold py-3 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-60 mb-3"
            >
              {salvando ? "Cancelando..." : "Confirmar cancelamento"}
            </button>
            <button
              onClick={() => setStep("buscar")}
              className="w-full text-gray-400 text-sm hover:text-white transition-colors py-2"
            >
              Voltar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Scissors className="text-[#D4AF37] mx-auto mb-3" size={32} />
          <h1 className="text-2xl font-bold text-white">{nomeBarbearia}</h1>
          <p className="text-gray-400 mt-1">Cancelamento de assinatura</p>
        </div>

        <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-8">
          {erro && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-4 py-3 mb-5 text-sm">
              {erro}
            </div>
          )}

          <form onSubmit={buscarAssinante} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Digite seu email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#D4AF37]"
                placeholder="seu@email.com"
                required
              />
            </div>

            <button
              type="submit"
              disabled={salvando}
              className="w-full bg-[#D4AF37] text-black font-bold py-3 rounded-lg hover:bg-[#B8960C] transition-colors disabled:opacity-60"
            >
              {salvando ? "Buscando..." : "Buscar assinatura"}
            </button>
          </form>

          <a
            href={`/${slug}`}
            className="block text-center text-gray-500 text-sm mt-4 hover:text-gray-300 transition-colors"
          >
            ← Voltar para a barbearia
          </a>
        </div>
      </div>
    </div>
  );
}
