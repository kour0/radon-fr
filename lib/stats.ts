// Type partagé pour le fichier stats.json produit par scripts/build-data.mjs
export type GlobalStats = {
  total: number;
  c1: number;
  c2: number;
  c3: number;
  pctC1: number;
  pctC2: number;
  pctC3: number;
  topDept: {
    code: string;
    nom: string;
    pctC3: number;
    c3: number;
    total: number;
  }[];
  source: string;
  generatedAt: string;
};

export function formatPct(n: number, digits = 1): string {
  return `${(n * 100).toFixed(digits)} %`;
}
