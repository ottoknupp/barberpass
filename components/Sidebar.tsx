"use client";
import { useState } from "react";
import Link from "next/link";
import { Scissors, Users, TrendingUp, DollarSign, Settings, LogOut, Menu, X } from "lucide-react";
import { supabase } from "@/lib/supabase";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: TrendingUp },
  { href: "/dashboard/assinantes", label: "Assinantes", icon: Users },
  { href: "/dashboard/planos", label: "Planos", icon: DollarSign },
  { href: "/dashboard/meu-plano", label: "Meu Plano", icon: TrendingUp },
  { href: "/dashboard/configuracoes", label: "Configurações", icon: Settings },
];

export default function Sidebar({ ativo }: { ativo: string }) {
  const [aberto, setAberto] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <>
      {/* Barra superior fixa no celular */}
      <header className="md:hidden fixed top-0 inset-x-0 z-40 bg-[#1a1a1a] border-b border-gray-800 flex items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <Scissors className="text-[#D4AF37]" size={20} />
          <span className="text-lg font-bold text-white">BarberPass</span>
        </Link>
        <button onClick={() => setAberto(true)} className="text-gray-300 hover:text-white p-1" aria-label="Abrir menu">
          <Menu size={24} />
        </button>
      </header>

      {/* Fundo escurecido quando o menu está aberto no celular */}
      {aberto && (
        <div className="md:hidden fixed inset-0 bg-black/60 z-40" onClick={() => setAberto(false)} />
      )}

      {/* Menu lateral: gaveta no celular, fixo no desktop */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-64 bg-[#1a1a1a] border-r border-gray-800 flex flex-col h-screen md:h-auto md:min-h-screen transform transition-transform md:transform-none ${
          aberto ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="p-6 border-b border-gray-800 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Scissors className="text-[#D4AF37]" size={20} />
            <span className="text-lg font-bold text-white">BarberPass</span>
          </Link>
          <button onClick={() => setAberto(false)} className="md:hidden text-gray-400 hover:text-white" aria-label="Fechar menu">
            <X size={20} />
          </button>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setAberto(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                ativo === l.href
                  ? "bg-[#D4AF37]/10 text-[#D4AF37] font-medium"
                  : "text-gray-400 hover:text-white hover:bg-gray-800"
              }`}
            >
              <l.icon size={18} /> {l.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-800">
          <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:text-red-400 transition-colors w-full">
            <LogOut size={18} /> Sair
          </button>
        </div>
      </aside>
    </>
  );
}
