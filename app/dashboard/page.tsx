"use client";
import Link from "next/link";
import { Scissors, Users, DollarSign, TrendingUp, AlertCircle, Plus, Settings, LogOut } from "lucide-react";

const stats = [
  { label: "Assinantes ativos", value: "0", icon: Users, color: "text-[#D4AF37]" },
  { label: "Receita mensal (MRR)", value: "R$0", icon: DollarSign, color: "text-green-400" },
  { label: "Novos este mês", value: "0", icon: TrendingUp, color: "text-blue-400" },
  { label: "Inadimplentes", value: "0", icon: AlertCircle, color: "text-red-400" },
];

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex">
      {/* Sidebar */}
      <aside className="w-64 bg-[#1a1a1a] border-r border-gray-800 flex flex-col">
        <div className="p-6 border-b border-gray-800">
          <Link href="/" className="flex items-center gap-2">
            <Scissors className="text-[#D4AF37]" size={20} />
            <span className="text-lg font-bold text-white">BarberPass</span>
          </Link>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-lg bg-[#D4AF37]/10 text-[#D4AF37] font-medium">
            <TrendingUp size={18} />
            Dashboard
          </Link>
          <Link href="/dashboard/assinantes" className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">
            <Users size={18} />
            Assinantes
          </Link>
          <Link href="/dashboard/planos" className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">
            <DollarSign size={18} />
            Planos
          </Link>
          <Link href="/dashboard/configuracoes" className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">
            <Settings size={18} />
            Configurações
          </Link>
        </nav>
        <div className="p-4 border-t border-gray-800">
          <button className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:text-red-400 transition-colors w-full">
            <LogOut size={18} />
            Sair
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Dashboard</h1>
            <p className="text-gray-400 mt-1">Bem-vindo ao seu painel de controle</p>
          </div>
          <Link
            href="/dashboard/planos/novo"
            className="flex items-center gap-2 bg-[#D4AF37] text-black font-semibold px-4 py-2 rounded-lg hover:bg-[#B8960C] transition-colors"
          >
            <Plus size={18} />
            Novo plano
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-gray-400 text-sm">{stat.label}</p>
                <stat.icon className={stat.color} size={20} />
              </div>
              <p className="text-3xl font-bold text-white">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Empty state */}
        <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-12 text-center">
          <Scissors className="text-[#D4AF37] mx-auto mb-4" size={48} />
          <h2 className="text-xl font-bold text-white mb-2">Comece criando um plano</h2>
          <p className="text-gray-400 mb-6">
            Crie os planos de assinatura da sua barbearia e compartilhe o link com seus clientes.
          </p>
          <Link
            href="/dashboard/planos/novo"
            className="inline-flex items-center gap-2 bg-[#D4AF37] text-black font-semibold px-6 py-3 rounded-lg hover:bg-[#B8960C] transition-colors"
          >
            <Plus size={18} />
            Criar primeiro plano
          </Link>
        </div>

        {/* Link público */}
        <div className="mt-6 bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-xl p-6">
          <h3 className="text-[#D4AF37] font-semibold mb-2">Seu link de cadastro</h3>
          <p className="text-gray-400 text-sm mb-3">Compartilhe esse link com seus clientes para que eles possam assinar seus planos:</p>
          <div className="flex items-center gap-3">
            <code className="flex-1 bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-2 text-gray-300 text-sm">
              barberpass.com/sua-barbearia
            </code>
            <button className="text-[#D4AF37] border border-[#D4AF37]/40 px-4 py-2 rounded-lg hover:bg-[#D4AF37]/10 transition-colors text-sm">
              Copiar
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
