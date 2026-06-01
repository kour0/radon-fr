// Pipeline: joint le CSV IRSN (catégorie radon par commune) avec le GeoJSON
// des communes. Produit :
//  - app/public/data/communes.geojson  (geom + {code, nom, cat})
//  - app/public/data/departements.geojson (geom + stats agrégées)
//  - app/public/data/stats.json (chiffres globaux pour le panneau latéral)

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT = path.resolve(ROOT, "public/data");
fs.mkdirSync(OUT, { recursive: true });

// Populations 2024 par code INSEE de département (estimations INSEE).
// Embarquées ici pour rendre les chiffres "X habitants en zone cat. 3"
// reproductibles sans dépendance externe supplémentaire.
const POP_BY_DEPT = {
  "01": 658000, "02": 524000, "03": 333000, "04": 165000, "05": 142000,
  "06": 1083000, "07": 327000, "08": 263000, "09": 153000, "10": 312000,
  "11": 376000, "12": 280000, "13": 2061000, "14": 696000, "15": 144000,
  "16": 350000, "17": 654000, "18": 297000, "19": 240000, "21": 535000,
  "22": 605000, "23": 113000, "24": 410000, "25": 542000, "26": 519000,
  "27": 600000, "28": 432000, "29": 925000, "2A": 167000, "2B": 191000,
  "30": 754000, "31": 1471000, "32": 192000, "33": 1659000, "34": 1212000,
  "35": 1098000, "36": 220000, "37": 615000, "38": 1281000, "39": 257000,
  "40": 422000, "41": 331000, "42": 763000, "43": 227000, "44": 1452000,
  "45": 690000, "46": 174000, "47": 332000, "48": 76000, "49": 822000,
  "50": 491000, "51": 564000, "52": 168000, "53": 308000, "54": 729000,
  "55": 184000, "56": 772000, "57": 1042000, "58": 200000, "59": 2611000,
  "60": 832000, "61": 277000, "62": 1463000, "63": 666000, "64": 689000,
  "65": 226000, "66": 488000, "67": 1158000, "68": 769000, "69": 1888000,
  "70": 233000, "71": 549000, "72": 568000, "73": 437000, "74": 845000,
  "75": 2102000, "76": 1242000, "77": 1450000, "78": 1442000, "79": 372000,
  "80": 569000, "81": 386000, "82": 263000, "83": 1083000, "84": 561000,
  "85": 700000, "86": 437000, "87": 365000, "88": 360000, "89": 333000,
  "90": 141000, "91": 1326000, "92": 1639000, "93": 1668000, "94": 1411000,
  "95": 1259000, "971": 384000, "972": 367000, "973": 286000, "974": 873000,
  "976": 320000,
};

// --- 1. Charger le CSV IRSN ---
const csv = fs.readFileSync(path.join(ROOT, "data/radon-irsn.csv"), "utf8");
const lines = csv.split(/\r?\n/).filter(Boolean);
const header = lines.shift();
console.log("CSV header:", header);

const radonByInsee = new Map();
for (const line of lines) {
  const parts = line.split(";");
  const nom_dept = parts[1];
  const insee_com = parts[2];
  const classe_potentiel = parts[3];
  if (!insee_com) continue;
  radonByInsee.set(insee_com, {
    cat: Number(classe_potentiel),
    dept: nom_dept,
  });
}
console.log(`Loaded ${radonByInsee.size} communes from IRSN CSV`);

// --- 2. Joindre avec les géométries communales ---
const communesRaw = JSON.parse(
  fs.readFileSync(path.join(ROOT, "data/communes.geojson"), "utf8"),
);

// Arrondit les coordonnées à 4 décimales (~11 m), suffisant pour la visu
// et divise par ~2 la taille du fichier.
function roundCoords(coords) {
  if (typeof coords[0] === "number") {
    return [Math.round(coords[0] * 1e4) / 1e4, Math.round(coords[1] * 1e4) / 1e4];
  }
  return coords.map(roundCoords);
}

// Calcul de centroïde simple sur des coordonnées plates [lng,lat]
function geomCentroid(coords) {
  let sx = 0, sy = 0, n = 0;
  function walk(c) {
    if (typeof c[0] === "number") { sx += c[0]; sy += c[1]; n++; }
    else c.forEach(walk);
  }
  walk(coords);
  return n > 0 ? [Math.round((sx / n) * 1e4) / 1e4, Math.round((sy / n) * 1e4) / 1e4] : null;
}

// Normalisation pour recherche : minuscules + suppression accents
function normalize(s) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

let matched = 0;
let unmatched = 0;
const enrichedFeatures = [];
const deptStats = new Map();
const searchEntries = []; // [{ k, c, n, d, lng, lat, q }]

for (const f of communesRaw.features) {
  if (!f.geometry) continue;
  const insee = f.properties.code;
  const radon = radonByInsee.get(insee);
  if (!radon) {
    unmatched++;
    continue;
  }
  matched++;

  const rounded = roundCoords(f.geometry.coordinates);
  const deptCode = insee.slice(0, 2);
  enrichedFeatures.push({
    type: "Feature",
    geometry: { type: f.geometry.type, coordinates: rounded },
    properties: { c: insee, n: f.properties.nom, d: deptCode, cat: radon.cat },
  });

  const c = geomCentroid(rounded);
  if (c) {
    searchEntries.push({
      k: "c", // commune
      c: insee,
      n: f.properties.nom,
      d: deptCode,
      cat: radon.cat,
      lng: c[0],
      lat: c[1],
      q: normalize(f.properties.nom),
    });
  }

  const s = deptStats.get(radon.dept) ?? { total: 0, c1: 0, c2: 0, c3: 0, code: deptCode };
  s.total++;
  s[`c${radon.cat}`]++;
  deptStats.set(radon.dept, s);
}
console.log(`Joined ${matched} communes, ${unmatched} without geometry match`);

const communesOut = {
  type: "FeatureCollection",
  features: enrichedFeatures,
};
fs.writeFileSync(
  path.join(OUT, "communes.geojson"),
  JSON.stringify(communesOut),
);
console.log(
  `→ communes.geojson : ${(fs.statSync(path.join(OUT, "communes.geojson")).size / 1024 / 1024).toFixed(1)} MB`,
);

// --- 3. Enrichir le GeoJSON des départements avec les stats ---
const deptRaw = JSON.parse(
  fs.readFileSync(path.join(ROOT, "data/departements.geojson"), "utf8"),
);

// Construit aussi un index code dept -> stats (on agrège par préfixe INSEE)
const statsByDeptCode = new Map();
for (const [name, s] of deptStats.entries()) {
  // certaines communes du même dept ont des préfixes différents (Corse 2A/2B)
  const existing = statsByDeptCode.get(s.code);
  if (existing) {
    existing.total += s.total;
    existing.c1 += s.c1;
    existing.c2 += s.c2;
    existing.c3 += s.c3;
  } else {
    statsByDeptCode.set(s.code, { ...s, name });
  }
}

const deptFeatures = deptRaw.features.filter((f) => f.geometry).map((f) => {
  const code = f.properties.code;
  const s = statsByDeptCode.get(code) ?? { total: 0, c1: 0, c2: 0, c3: 0 };
  const pctC3 = s.total > 0 ? s.c3 / s.total : 0;
  const pctRisque = s.total > 0 ? (s.c2 + s.c3) / s.total : 0;
  const rounded = roundCoords(f.geometry.coordinates);

  // Ajout au search index
  const c = geomCentroid(rounded);
  if (c && s.total > 0) {
    searchEntries.push({
      k: "d", // département
      c: code,
      n: f.properties.nom,
      d: code,
      total: s.total,
      pctC3: Math.round(pctC3 * 1000) / 1000,
      lng: c[0],
      lat: c[1],
      q: normalize(f.properties.nom),
    });
  }

  return {
    type: "Feature",
    geometry: { type: f.geometry.type, coordinates: rounded },
    properties: {
      code,
      nom: f.properties.nom,
      total: s.total,
      c1: s.c1,
      c2: s.c2,
      c3: s.c3,
      pctC3: Math.round(pctC3 * 1000) / 1000,
      pctRisque: Math.round(pctRisque * 1000) / 1000,
    },
  };
});

// --- 3b. Search index ---
fs.writeFileSync(path.join(OUT, "search-index.json"), JSON.stringify(searchEntries));
console.log(
  `→ search-index.json : ${searchEntries.length} entrées (${(fs.statSync(path.join(OUT, "search-index.json")).size / 1024).toFixed(0)} KB)`,
);

fs.writeFileSync(
  path.join(OUT, "departements.geojson"),
  JSON.stringify({ type: "FeatureCollection", features: deptFeatures }),
);
console.log(
  `→ departements.geojson : ${(fs.statSync(path.join(OUT, "departements.geojson")).size / 1024).toFixed(0)} KB`,
);

// --- 4. Stats globales pour le panneau latéral ---
let totalC1 = 0, totalC2 = 0, totalC3 = 0;
for (const s of deptStats.values()) {
  totalC1 += s.c1;
  totalC2 += s.c2;
  totalC3 += s.c3;
}
const total = totalC1 + totalC2 + totalC3;

// Pop estimée en zone cat. 3 par dept = pop_dept × (c3 / total_communes_dept).
// C'est une approximation (suppose une densité de pop uniforme par commune
// dans le département) ; suffisante pour donner un ordre de grandeur.
const topDept = [...statsByDeptCode.entries()]
  .filter(([, s]) => s.total >= 50)
  .map(([code, s]) => {
    const pop = POP_BY_DEPT[code] ?? 0;
    const ratioC3 = s.c3 / s.total;
    return {
      code,
      nom: s.name,
      pctC3: ratioC3,
      c3: s.c3,
      total: s.total,
      pop,
      popC3: Math.round(pop * ratioC3),
    };
  })
  .sort((a, b) => b.pctC3 - a.pctC3)
  .slice(0, 15)
  .map((d) => ({ ...d, pctC3: Math.round(d.pctC3 * 1000) / 1000 }));

// Total national : population estimée en zone cat. 3 sur tous les dept.
let totalPop = 0;
let totalPopC3 = 0;
for (const [code, s] of statsByDeptCode.entries()) {
  const pop = POP_BY_DEPT[code];
  if (!pop || s.total === 0) continue;
  totalPop += pop;
  totalPopC3 += Math.round(pop * (s.c3 / s.total));
}

const stats = {
  total,
  c1: totalC1,
  c2: totalC2,
  c3: totalC3,
  pctC3: Math.round((totalC3 / total) * 10000) / 100,
  pctC2: Math.round((totalC2 / total) * 10000) / 100,
  pctC1: Math.round((totalC1 / total) * 10000) / 100,
  population: {
    total: totalPop,
    inCat3: totalPopC3,
    pctInCat3: Math.round((totalPopC3 / totalPop) * 1000) / 10,
  },
  topDept,
  source: "IRSN / ASNR — Connaître le potentiel radon de ma commune (data.gouv.fr) · Pop INSEE 2024",
  generatedAt: new Date().toISOString(),
};

fs.writeFileSync(path.join(OUT, "stats.json"), JSON.stringify(stats, null, 2));
console.log("→ stats.json :", stats.total, "communes totales");
console.log("Top dept cat-3 %:", topDept.slice(0, 5));
