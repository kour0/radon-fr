// Télécharge les jeux de données bruts utilisés par le pipeline.
// Idempotent : si un fichier existe déjà, il est conservé.
// Lancer via `pnpm data:fetch`.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const RAW = path.resolve(ROOT, "data");
fs.mkdirSync(RAW, { recursive: true });

const SOURCES = [
  {
    name: "radon-irsn.csv",
    url: "https://www.data.gouv.fr/api/1/datasets/r/817114f8-9b61-48fa-b7a4-0e3c1331a44c",
    note: "IRSN / ASNR — Potentiel radon par commune (data.gouv.fr)",
  },
  {
    name: "departements.geojson",
    url: "https://raw.githubusercontent.com/gregoiredavid/france-geojson/master/departements-version-simplifiee.geojson",
    note: "Contours départementaux simplifiés (gregoiredavid/france-geojson)",
  },
  {
    name: "communes.geojson",
    url: "https://raw.githubusercontent.com/gregoiredavid/france-geojson/master/communes-version-simplifiee.geojson",
    note: "Contours communaux simplifiés (gregoiredavid/france-geojson)",
  },
  {
    name: "cadastre-minier-titres.csv",
    url: "https://www.data.gouv.fr/api/1/datasets/r/df16a407-5292-4f03-b8b7-f028b66b5150",
    note: "Cadastre minier — titres miniers en cours et clos (data.gouv.fr / Camino)",
  },
];

async function download(url, dest) {
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) throw new Error(`HTTP ${res.status} on ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(dest, buf);
  return buf.length;
}

for (const s of SOURCES) {
  const dest = path.join(RAW, s.name);
  if (fs.existsSync(dest)) {
    console.log(`✓ ${s.name} (déjà présent, ${(fs.statSync(dest).size / 1024 / 1024).toFixed(1)} MB) — ${s.note}`);
    continue;
  }
  process.stdout.write(`↓ ${s.name} … `);
  const size = await download(s.url, dest);
  console.log(`${(size / 1024 / 1024).toFixed(1)} MB — ${s.note}`);
}
