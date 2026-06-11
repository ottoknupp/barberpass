import Link from "next/link";
import { Scissors, CheckCircle, Star, Users, TrendingUp, Shield } from "lucide-react";

const plans = [
  {
    name: "Starter",
    price: "R$79",
    limit: "até 50 assinantes",
    features: ["Planos ilimitados", "Painel de controle", "Suporte por email"],
  },
  {
    name: "Pro",
    price: "R$149",
    limit: "até 200 assinantes",
    features: ["Tudo do Starter", "Relatórios avançados", "Link personalizado", "Suporte prioritário"],
    popular: true,
  },
  {
    name: "Ilimitado",
    price: "R$299",
    limit: "sem limite de assinantes",
    features: ["Tudo do Pro", "Multi-unidades", "API de integração", "Suporte 24/7"],
  },
];

const features = [
  { icon: Users, title: "Gestão de Assinantes", desc: "Controle todos os seus clientes em um só lugar" },
  { icon: TrendingUp, title: "Receita Recorrente", desc: "Cobranças automáticas todo mês no cartão do cliente" },
  { icon: Shield, title: "Pagamento Seguro", desc: "Integrado com Stripe — líder mundial em pagamentos" },
  { icon: Star, title: "Link Personalizado", desc: "Sua barbearia tem uma página exclusiva para captação" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Navbar */}
      <nav className="border-b border-[#D4AF37]/20 px-6 py-4 flex items-center justify-between max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <Scissors className="text-[#D4AF37]" size={24} />
          <span className="text-xl font-bold text-white">BarberPass</span>
        </div>
        <div className="flex gap-4">
          <Link href="/login" className="text-gray-400 hover:text-white transition-colors px-4 py-2">
            Entrar
          </Link>
          <Link href="/cadastro" className="bg-[#D4AF37] text-black font-semibold px-4 py-2 rounded-lg hover:bg-[#B8960C] transition-colors">
            Começar grátis
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 py-24 text-center">
        <div className="inline-flex items-center gap-2 bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-full px-4 py-2 text-[#D4AF37] text-sm mb-8">
          <Star size={14} />
          <span>14 dias grátis, sem cartão de crédito</span>
        </div>
        <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
          Gerencie as assinaturas<br />
          <span className="text-[#D4AF37]">da sua barbearia</span>
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10">
          Crie planos de assinatura, cadastre clientes com cartão de crédito e receba automaticamente todo mês. Tudo em um só sistema.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/cadastro" className="bg-[#D4AF37] text-black font-bold px-8 py-4 rounded-lg text-lg hover:bg-[#B8960C] transition-colors">
            Começar grátis por 14 dias
          </Link>
          <Link href="#planos" className="border border-gray-600 text-white px-8 py-4 rounded-lg text-lg hover:border-[#D4AF37] transition-colors">
            Ver planos
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f) => (
            <div key={f.title} className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-6 hover:border-[#D4AF37]/40 transition-colors">
              <f.icon className="text-[#D4AF37] mb-4" size={28} />
              <h3 className="text-white font-semibold mb-2">{f.title}</h3>
              <p className="text-gray-400 text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="planos" className="max-w-6xl mx-auto px-6 py-24">
        <h2 className="text-3xl font-bold text-center text-white mb-4">Planos para sua barbearia</h2>
        <p className="text-gray-400 text-center mb-12">Escolha o plano ideal e comece a receber de forma recorrente</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-xl p-8 border ${plan.popular ? "border-[#D4AF37] bg-[#D4AF37]/5" : "border-gray-800 bg-[#1a1a1a]"} relative`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#D4AF37] text-black text-xs font-bold px-4 py-1 rounded-full">
                  MAIS POPULAR
                </div>
              )}
              <h3 className="text-xl font-bold text-white mb-1">{plan.name}</h3>
              <p className="text-gray-500 text-sm mb-4">{plan.limit}</p>
              <div className="text-4xl font-bold text-[#D4AF37] mb-6">
                {plan.price}<span className="text-lg text-gray-400">/mês</span>
              </div>
              <ul className="space-y-3 mb-8">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-gray-300 text-sm">
                    <CheckCircle size={16} className="text-[#D4AF37]" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/cadastro"
                className={`block text-center py-3 rounded-lg font-semibold transition-colors ${plan.popular ? "bg-[#D4AF37] text-black hover:bg-[#B8960C]" : "border border-gray-600 text-white hover:border-[#D4AF37]"}`}
              >
                Começar agora
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-8 text-center text-gray-500 text-sm">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Scissors className="text-[#D4AF37]" size={16} />
          <span className="text-white font-semibold">BarberPass</span>
        </div>
        <p>© 2024 BarberPass. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}
