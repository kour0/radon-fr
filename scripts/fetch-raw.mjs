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
  {
    name: "communes-pop.csv.gz",
    url: "https://www.data.gouv.fr/api/1/datasets/r/6989ed1a-8ffb-4ef9-b008-340327c99430",
    note: "Communes & villes de France — pop par code INSEE (data.gouv.fr)",
    gunzipTo: "communes-pop.csv",
  },
];

import zlib from "node:zlib";

async function download(url, dest) {
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) throw new Error(`HTTP ${res.status} on ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(dest, buf);
  return buf.length;
}

for (const s of SOURCES) {
  const finalName = s.gunzipTo ?? s.name;
  const finalDest = path.join(RAW, finalName);
  if (fs.existsSync(finalDest)) {
    console.log(`✓ ${finalName} (déjà présent, ${(fs.statSync(finalDest).size / 1024 / 1024).toFixed(1)} MB) — ${s.note}`);
    continue;
  }
  process.stdout.write(`↓ ${s.name} … `);
  const tmpDest = path.join(RAW, s.name);
  const size = await download(s.url, tmpDest);
  console.log(`${(size / 1024 / 1024).toFixed(1)} MB — ${s.note}`);
  if (s.gunzipTo) {
    const gz = fs.readFileSync(tmpDest);
    fs.writeFileSync(finalDest, zlib.gunzipSync(gz));
    fs.unlinkSync(tmpDest);
    console.log(`  → décompressé : ${finalName} (${(fs.statSync(finalDest).size / 1024 / 1024).toFixed(1)} MB)`);
  }
}
