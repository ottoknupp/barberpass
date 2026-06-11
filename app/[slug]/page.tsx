"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Scissors, CheckCircle, Phone, Mail, User, CreditCard, Lock } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Plano = {
  id: string;
  nome: string;
  descricao: string;
  preco: number;
  beneficios: string[];
};

type Barbearia = {
  id: string;
  nome: string;
  nome_responsavel: string;
  telefone: string;
};

export default function PaginaPublica() {
  const params = useParams();
  const slug = params.slug as string;

  const [barbearia, setBarbearia] = useState<Barbearia | null>(null);
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [planoSelecionado, setPlanoSelecionado] = useState<Plano | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [step, setStep] = useState<"planos" | "cadastro" | "sucesso">("planos");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  const [form, setForm] = useState({
    nome: "",
    email: "",
    telefone: "",
    cpf: "",
  });

  const [card, setCard] = useState({
    numero: "",
    nome: "",
    validade: "",
    cvv: "",
  });

  useEffect(() => {
    carregarDados();
  }, [slug]);

  const carregarDados = async () => {
    const { data: barb } = await supabase
      .from("barbershops")
      .select("id, nome, nome_responsavel, telefone")
      .eq("slug", slug)
      .single();

    if (!barb) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    setBarbearia(barb);

    const { data: planosData } = await supabase
      .from("subscription_plans")
      .select("*")
      .eq("barbershop_id", barb.id)
      .eq("ativo", true)
      .order("preco", { ascending: true });

    setPlanos(planosData || []);
    setLoading(false);
  };

  const selecionarPlano = (plano: Plano) => {
    setPlanoSelecionado(plano);
    setStep("cadastro");
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleCardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    const name = e.target.name;

    if (name === "numero") {
      value = value.replace(/\D/g, "").replace(/(.{4})/g, "$1 ").trim().slice(0, 19);
    }
    if (name === "validade") {
      value = value.replace(/\D/g, "").replace(/(\d{2})(\d)/, "$1/$2").slice(0, 5);
    }
    if (name === "cvv") {
      value = value.replace(/\D/g, "").slice(0, 4);
    }
    if (name === "cpf") {
      value = value.replace(/\D/g, "").replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4").slice(0, 14);
    }

    setCard({ ...card, [name]: value });
  };

  const handleCadastro = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvando(true);
    setErro("");

    try {
      // Verificar se já existe
      const { data: clienteExistente } = await supabase
        .from("customers")
        .select("id")
        .eq("email", form.email)
        .eq("barbershop_id", barbearia!.id)
        .single();

      if (clienteExistente) {
        throw new Error("Este email já está cadastrado nesta barbearia.");
      }

      // Processar pagamento via Pagar.me
      const pagamentoRes = await fetch("/api/pagamento", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerData: { ...form },
          planData: planoSelecionado,
          cardData: card,
        }),
      });

      const pagamento = await pagamentoRes.json();
      if (!pagamentoRes.ok) {
        throw new Error(pagamento.error || "Erro ao processar pagamento");
      }

      // Salvar cliente no Supabase
      const { data: cliente, error: errCliente } = await supabase
        .from("customers")
        .insert({
          barbershop_id: barbearia!.id,
          nome: form.nome,
          email: form.email,
          telefone: form.telefone,
          pagarme_customer_id: pagamento.pagarme_customer_id,
        })
        .select()
        .single();

      if (errCliente) throw errCliente;

      // Salvar assinatura no Supabase
      const { error: errSub } = await supabase
        .from("subscriptions")
        .insert({
          customer_id: cliente.id,
          plan_id: planoSelecionado!.id,
          status: "ativo",
          pagarme_subscription_id: pagamento.pagarme_subscription_id,
        });

      if (errSub) throw errSub;

      setStep("sucesso");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro ao realizar cadastro";
      setErro(message);
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

  if (step === "sucesso") {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-green-400/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="text-green-400" size={40} />
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">Assinatura confirmada!</h1>
          <p className="text-gray-400 mb-2">
            Bem-vindo à <span className="text-[#D4AF37]">{barbearia?.nome}</span>!
          </p>
          <p className="text-gray-400 mb-6">
            Você assinou o plano <span className="text-white font-semibold">{planoSelecionado?.nome}</span> por{" "}
            <span className="text-[#D4AF37] font-bold">R${planoSelecionado?.preco.toFixed(2).replace(".", ",")}/mês</span>.
          </p>
          <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-6 text-left">
            <p className="text-gray-400 text-sm mb-3">Próximos passos:</p>
            <ul className="space-y-2 text-sm text-gray-300">
              <li className="flex items-center gap-2"><CheckCircle size={14} className="text-green-400" /> Pagamento processado com sucesso</li>
              <li className="flex items-center gap-2"><CheckCircle size={14} className="text-green-400" /> Você será cobrado automaticamente todo mês</li>
              <li className="flex items-center gap-2"><CheckCircle size={14} className="text-green-400" /> Agende seu primeiro atendimento</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  if (step === "cadastro") {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Scissors className="text-[#D4AF37] mx-auto mb-3" size={32} />
            <h1 className="text-2xl font-bold text-white">{barbearia?.nome}</h1>
            <p className="text-gray-400 mt-1">Complete seu cadastro para assinar</p>
          </div>

          <div className="bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-xl p-4 mb-6">
            <p className="text-[#D4AF37] font-semibold">{planoSelecionado?.nome}</p>
            <p className="text-white text-2xl font-bold">
              R${planoSelecionado?.preco.toFixed(2).replace(".", ",")}
              <span className="text-gray-400 text-sm">/mês</span>
            </p>
          </div>

          <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-8">
            {erro && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-4 py-3 mb-5 text-sm">
                {erro}
              </div>
            )}

            <form onSubmit={handleCadastro} className="space-y-5">
              {/* Dados pessoais */}
              <div>
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <User size={16} className="text-[#D4AF37]" /> Seus dados
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Nome completo</label>
                    <input
                      type="text"
                      name="nome"
                      value={form.nome}
                      onChange={handleChange}
                      className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#D4AF37]"
                      placeholder="João Silva"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">CPF</label>
                    <input
                      type="text"
                      name="cpf"
                      value={form.cpf}
                      onChange={handleChange}
                      className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#D4AF37]"
                      placeholder="000.000.000-00"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                      <input
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#D4AF37]"
                        placeholder="joao@email.com"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">WhatsApp</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                      <input
                        type="tel"
                        name="telefone"
                        value={form.telefone}
                        onChange={handleChange}
                        className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#D4AF37]"
                        placeholder="(11) 99999-9999"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Dados do cartão */}
              <div>
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <CreditCard size={16} className="text-[#D4AF37]" /> Cartão de crédito
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Número do cartão</label>
                    <input
                      type="text"
                      name="numero"
                      value={card.numero}
                      onChange={handleCardChange}
                      className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#D4AF37]"
                      placeholder="0000 0000 0000 0000"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Nome no cartão</label>
                    <input
                      type="text"
                      name="nome"
                      value={card.nome}
                      onChange={handleCardChange}
                      className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#D4AF37]"
                      placeholder="JOAO SILVA"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Validade</label>
                      <input
                        type="text"
                        name="validade"
                        value={card.validade}
                        onChange={handleCardChange}
                        className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#D4AF37]"
                        placeholder="MM/AA"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">CVV</label>
                      <input
                        type="text"
                        name="cvv"
                        value={card.cvv}
                        onChange={handleCardChange}
                        className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#D4AF37]"
                        placeholder="000"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-gray-500 text-xs">
                <Lock size={12} />
                <span>Pagamento seguro processado pelo Pagar.me</span>
              </div>

              <button
                type="submit"
                disabled={salvando}
                className="w-full bg-[#D4AF37] text-black font-bold py-3 rounded-lg hover:bg-[#B8960C] transition-colors disabled:opacity-60"
              >
                {salvando ? "Processando pagamento..." : `Assinar por R$${planoSelecionado?.preco.toFixed(2).replace(".", ",")}/mês`}
              </button>
            </form>

            <button
              onClick={() => setStep("planos")}
              className="w-full mt-4 text-gray-500 text-sm hover:text-gray-300 transition-colors"
            >
              ← Voltar para os planos
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <Scissors className="text-[#D4AF37] mx-auto mb-4" size={48} />
          <h1 className="text-4xl font-bold text-white mb-2">{barbearia?.nome}</h1>
          <p className="text-gray-400">Escolha o plano ideal para você</p>
        </div>

        {planos.length === 0 ? (
          <div className="text-center text-gray-400">
            <p>Nenhum plano disponível no momento.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {planos.map((plano) => (
              <div key={plano.id} className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-8 hover:border-[#D4AF37]/40 transition-colors">
                <h3 className="text-xl font-bold text-white mb-1">{plano.nome}</h3>
                {plano.descricao && <p className="text-gray-500 text-sm mb-4">{plano.descricao}</p>}
                <div className="text-4xl font-bold text-[#D4AF37] mb-6">
                  R${plano.preco.toFixed(2).replace(".", ",")}
                  <span className="text-lg text-gray-400">/mês</span>
                </div>

                {plano.beneficios && plano.beneficios.length > 0 && (
                  <ul className="space-y-3 mb-8">
                    {plano.beneficios.map((b, i) => (
                      <li key={i} className="flex items-center gap-2 text-gray-300 text-sm">
                        <CheckCircle size={16} className="text-[#D4AF37]" />
                        {b}
                      </li>
                    ))}
                  </ul>
                )}

                <button
                  onClick={() => selecionarPlano(plano)}
                  className="w-full bg-[#D4AF37] text-black font-bold py-3 rounded-lg hover:bg-[#B8960C] transition-colors"
                >
                  Assinar agora
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
