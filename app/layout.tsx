import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BarberPass — Gestão de Assinaturas para Barbearias",
  description: "Sistema SaaS de assinaturas para barbearias",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="h-full">
      <body className="min-h-full flex flex-col bg-[#0a0a0a] text-white">
        {children}
      </body>
    </html>
  );
}
