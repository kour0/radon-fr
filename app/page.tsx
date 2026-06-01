import fs from "node:fs/promises";
import path from "node:path";
import { RadonShell } from "@/components/radon-shell";
import type { GlobalStats } from "@/lib/stats";

async function loadStats(): Promise<GlobalStats> {
  const p = path.join(process.cwd(), "public", "data", "stats.json");
  const raw = await fs.readFile(p, "utf8");
  return JSON.parse(raw) as GlobalStats;
}

export default async function Page() {
  const stats = await loadStats();
  return <RadonShell stats={stats} />;
}
