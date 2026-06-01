// Type partagé pour le fichier stats.json produit par scripts/build-data.mjs
export type GlobalStats = {
  total: number;
  c1: number;
  c2: number;
  c3: number;
  pctC1: number;
  pctC2: number;
  pctC3: number;
  population: {
    total: number;
    inCat3: number;
    pctInCat3: number;
  };
  topDept: {
    code: string;
    nom: string;
    pctC3: number;
    c3: number;
    total: number;
    pop: number;
    popC3: number;
  }[];
  source: string;
  generatedAt: string;
};

export function formatPct(n: number, digits = 1): string {
  return `${(n * 100).toFixed(digits)} %`;
}

/** Formate une population : 1_650_000 → "1,65 M", 245_000 → "245 k" */
export function formatHabitants(n: number): string {
  if (n >= 1_000_000) {
    const v = (n / 1_000_000).toFixed(n >= 10_000_000 ? 1 : 2);
    return `${v.replace(".", ",")} M`;
  }
  if (n >= 1_000) return `${Math.round(n / 1_000)} k`;
  return `${n}`;
}
