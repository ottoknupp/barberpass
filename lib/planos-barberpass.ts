export type PlanoBarberPass = "gratis" | "crescimento" | "profissional" | "premium";

export const PLANOS = {
  gratis:       { nome: "Grátis",        limite: 10,       preco: 0   },
  crescimento:  { nome: "Crescimento",   limite: 30,       preco: 49  },
  profissional: { nome: "Profissional",  limite: 100,      preco: 99  },
  premium:      { nome: "Premium",       limite: Infinity, preco: 199 },
};

export function getLimitePlano(plano: PlanoBarberPass): number {
  return PLANOS[plano]?.limite ?? 10;
}

export function getPlanoAtual(totalAssinantes: number): PlanoBarberPass {
  if (totalAssinantes <= 10)  return "gratis";
  if (totalAssinantes <= 30)  return "crescimento";
  if (totalAssinantes <= 100) return "profissional";
  return "premium";
}
