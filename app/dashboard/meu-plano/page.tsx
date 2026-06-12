"use client";
import { useState, useEffect } from "react";
import { CheckCircle, X, CreditCard, Lock } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { PLANOS, getPlanoAtual, type PlanoBarberPass } from "@/lib/planos-barberpass";
import Sidebar from "@/components/Sidebar";

export default function MeuPlanoPage() {
  const [planoAtual, setPlanoAtual] = useState<PlanoBarberPass>("gratis");
  const [totalAssinantes, setTotalAssinantes] = useState(0);
  const [barbershopId, setBarbershopId] = useState("");
  const [loading, setLoading] = useState(true);

  // Checkout
  const [checkoutPlano, setCheckoutPlano] = useState<PlanoBarberPass | null>(null);
  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState(false);
  const [holder, setHolder] = useState({ nome: "", cpfCnpj: "", cep: "", numero: "" });
  const [card, setCard] = useState({ numero: "", nome: "", validade: "", cvv: "" });

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: barbershop } = await supabase
      .from("barbershops")
      .select("id, plano")
      .eq("email", user.email)
      .single();

    if (!barbershop) return;
    setBarbershopId(barbershop.id);

    const { count } = await supabase
      .from("subscriptions")
      .select("id, customers!inner(barbershop_id)", { count: "exact", head: true })
      .eq("customers.barbershop_id", barbershop.id)
      .eq("status", "ativo");

    const total = count || 0;
    setTotalAssinantes(total);
    setPlanoAtual((barbershop.plano || getPlanoAtual(total)) as PlanoBarberPass);
    setLoading(false);
  };

  const abrirCheckout = (p: PlanoBarberPass) => {
    setCheckoutPlano(p);
    setErro("");
    setSucesso(false);
  };

  const fecharCheckout = () => {
    if (processando) return;
    setCheckoutPlano(null);
    setHolder({ nome: "", cpfCnpj: "", cep: "", numero: "" });
    setCard({ numero: "", nome: "", validade: "", cvv: "" });
  };

  const handleHolderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    const name = e.target.name;
    if (name === "cpfCnpj") value = value.replace(/\D/g, "").slice(0, 14);
    if (name === "cep") value = value.replace(/\D/g, "").replace(/(\d{5})(\d)/, "$1-$2").slice(0, 9);
    setHolder({ ...holder, [name]: value });
  };

  const handleCardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    const name = e.target.name;
    if (name === "numero") value = value.replace(/\D/g, "").replace(/(.{4})/g, "$1 ").trim().slice(0, 19);
    if (name === "validade") value = value.replace(/\D/g, "").replace(/(\d{2})(\d)/, "$1/$2").slice(0, 5);
    if (name === "cvv") value = value.replace(/\D/g, "").slice(0, 4);
    setCard({ ...card, [name]: value });
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkoutPlano) return;
    setProcessando(true);
    setErro("");

    try {
      const res = await fetch("/api/upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          barbershopId,
          plano: checkoutPlano,
          holder,
          card,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao processar pagamento");

      // Atualiza o plano da barbearia (sessão autenticada -> RLS permite)
      const { error: errUpd } = await supabase
        .from("barbershops")
        .update({ plano: checkoutPlano })
        .eq("id", barbershopId);
      if (errUpd) throw errUpd;

      setPlanoAtual(checkoutPlano);
      setSucesso(true);
      setCheckoutPlano(null);
      setHolder({ nome: "", cpfCnpj: "", cep: "", numero: "" });
      setCard({ numero: "", nome: "", validade: "", cvv: "" });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro ao processar pagamento";
      setErro(message);
    } finally {
      setProcessando(false);
    }
  };

  const planosOrdem: PlanoBarberPass[] = ["gratis", "crescimento", "profissional", "premium"];
  const limiteAtual = PLANOS[planoAtual].limite;
  const porcentagem = limiteAtual === Infinity ? 0 : Math.min((totalAssinantes / limiteAtual) * 100, 100);
  const proximoPlano = planosOrdem[planosOrdem.indexOf(planoAtual) + 1];

  return (
    <div className="min-h-screen bg-[#0a0a0a] md:flex">
      <Sidebar ativo="/dashboard/meu-plano" />

      <main className="flex-1 p-4 pt-20 md:p-8 md:pt-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Meu Plano</h1>
          <p className="text-gray-400 mt-1">Gerencie sua assinatura do BarberPass</p>
        </div>

        {loading ? (
          <p className="text-gray-400">Carregando...</p>
        ) : (
          <div className="max-w-3xl space-y-6">
            {sucesso && (
              <div className="bg-green-500/10 border border-green-500/30 text-green-400 rounded-lg px-4 py-3 text-sm">
                ✓ Upgrade realizado! Seu plano foi atualizado e a cobrança mensal está ativa.
              </div>
            )}

            {/* Plano atual */}
            <div className="bg-[#1a1a1a] border border-[#D4AF37]/40 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-gray-400 text-sm">Plano atual</p>
                  <p className="text-2xl font-bold text-white">{PLANOS[planoAtual].nome}</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-[#D4AF37]">
                    {PLANOS[planoAtual].preco === 0 ? "Grátis" : `R$${PLANOS[planoAtual].preco}/mês`}
                  </p>
                </div>
              </div>

              <div className="mb-2">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">Assinantes ativos</span>
                  <span className={`font-semibold ${porcentagem >= 90 ? "text-red-400" : "text-white"}`}>
                    {totalAssinantes} / {limiteAtual === Infinity ? "∞" : limiteAtual}
                  </span>
                </div>
                {limiteAtual !== Infinity && (
                  <div className="w-full bg-gray-800 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${porcentagem >= 90 ? "bg-red-400" : "bg-[#D4AF37]"}`}
                      style={{ width: `${porcentagem}%` }}
                    />
                  </div>
                )}
              </div>

              {porcentagem >= 80 && proximoPlano && (
                <p className="text-yellow-500 text-sm mt-3">
                  ⚠ Você está usando {Math.round(porcentagem)}% do seu limite. Considere fazer upgrade.
                </p>
              )}
              {limiteAtual !== Infinity && totalAssinantes >= limiteAtual && (
                <p className="text-red-400 text-sm mt-3">
                  ✕ Limite atingido — novos clientes não conseguem se cadastrar.
                </p>
              )}
            </div>

            {/* Planos disponíveis */}
            <h2 className="text-white font-semibold text-lg">Todos os planos</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {planosOrdem.map((p) => {
                const info = PLANOS[p];
                const isAtual = p === planoAtual;
                const podeAssinar = info.preco > 0 && !isAtual;
                return (
                  <div
                    key={p}
                    className={`rounded-xl p-6 border ${isAtual ? "border-[#D4AF37] bg-[#D4AF37]/5" : "border-gray-800 bg-[#1a1a1a]"}`}
                  >
                    {isAtual && (
                      <span className="text-xs bg-[#D4AF37] text-black font-bold px-2 py-0.5 rounded-full mb-3 inline-block">
                        PLANO ATUAL
                      </span>
                    )}
                    <p className="text-white font-bold text-lg">{info.nome}</p>
                    <p className="text-[#D4AF37] text-2xl font-bold mt-1">
                      {info.preco === 0 ? "Grátis" : `R$${info.preco}/mês`}
                    </p>
                    <p className="text-gray-400 text-sm mt-1">
                      {info.limite === Infinity ? "Assinantes ilimitados" : `Até ${info.limite} assinantes`}
                    </p>
                    {isAtual ? (
                      <div className="flex items-center gap-2 text-green-400 text-sm mt-4">
                        <CheckCircle size={14} /> Plano ativo
                      </div>
                    ) : podeAssinar ? (
                      <button
                        onClick={() => abrirCheckout(p)}
                        className="w-full mt-4 bg-[#D4AF37] text-black font-bold py-2.5 rounded-lg hover:bg-[#B8960C] transition-colors text-sm"
                      >
                        Assinar este plano
                      </button>
                    ) : (
                      <div className="mt-4 text-gray-600 text-sm">Plano gratuito padrão</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* Modal de checkout */}
      {checkoutPlano && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center px-4 py-8 z-50 overflow-y-auto">
          <div className="bg-[#1a1a1a] border border-gray-800 rounded-2xl w-full max-w-md my-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-800">
              <div>
                <h3 className="text-white font-bold text-lg">Assinar {PLANOS[checkoutPlano].nome}</h3>
                <p className="text-[#D4AF37] font-bold">R${PLANOS[checkoutPlano].preco}/mês</p>
              </div>
              <button onClick={fecharCheckout} className="text-gray-500 hover:text-white" disabled={processando}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCheckout} className="p-6 space-y-4">
              {erro && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-4 py-3 text-sm">
                  {erro}
                </div>
              )}

              <div>
                <label className="block text-sm text-gray-400 mb-2">Nome do responsável</label>
                <input type="text" name="nome" value={holder.nome} onChange={handleHolderChange}
                  className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-[#D4AF37]"
                  placeholder="Seu nome completo" required />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">CPF ou CNPJ da barbearia</label>
                <input type="text" name="cpfCnpj" value={holder.cpfCnpj} onChange={handleHolderChange}
                  className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-[#D4AF37]"
                  placeholder="Somente números" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">CEP</label>
                  <input type="text" name="cep" value={holder.cep} onChange={handleHolderChange}
                    className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-[#D4AF37]"
                    placeholder="00000-000" required />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Número</label>
                  <input type="text" name="numero" value={holder.numero} onChange={handleHolderChange}
                    className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-[#D4AF37]"
                    placeholder="Ex: 123" required />
                </div>
              </div>

              <div className="pt-2 border-t border-gray-800">
                <h4 className="text-white font-semibold mb-3 flex items-center gap-2 mt-3">
                  <CreditCard size={16} className="text-[#D4AF37]" /> Cartão de crédito
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Número do cartão</label>
                    <input type="text" name="numero" value={card.numero} onChange={handleCardChange}
                      className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-[#D4AF37]"
                      placeholder="0000 0000 0000 0000" required />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Nome no cartão</label>
                    <input type="text" name="nome" value={card.nome} onChange={handleCardChange}
                      className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-[#D4AF37]"
                      placeholder="JOAO SILVA" required />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Validade</label>
                      <input type="text" name="validade" value={card.validade} onChange={handleCardChange}
                        className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-[#D4AF37]"
                        placeholder="MM/AA" required />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">CVV</label>
                      <input type="text" name="cvv" value={card.cvv} onChange={handleCardChange}
                        className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-[#D4AF37]"
                        placeholder="000" required />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-gray-500 text-xs">
                <Lock size={12} />
                <span>Cobrança mensal automática · cancele quando quiser</span>
              </div>

              <button type="submit" disabled={processando}
                className="w-full bg-[#D4AF37] text-black font-bold py-3 rounded-lg hover:bg-[#B8960C] transition-colors disabled:opacity-60">
                {processando ? "Processando..." : `Assinar por R$${PLANOS[checkoutPlano].preco}/mês`}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
