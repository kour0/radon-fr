// Construit les couches d'overlays :
//  - uranium.geojson : anciens sites / titres miniers concernant l'uranium
//    (extrait du cadastre minier — data.gouv.fr / Camino, M. Transition écologique)
//  - volcanism.geojson : centres volcaniques majeurs du Massif central
//    (liste curatée — roches volcaniques = uranium primaire = radon)
//
// Pourquoi ces deux couches ?
//  • Les anciennes mines d'uranium : corrélation directe (le minerai EST la source).
//  • Le volcanisme : les laves alcalines / phonolites du Massif central
//    sont riches en uranium et thorium, et émettent du radon.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "csv-parse/sync";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT = path.resolve(ROOT, "public/data");
fs.mkdirSync(OUT, { recursive: true });

// --- 1. URANIUM : depuis le cadastre minier (Camino) ---
const csvRaw = fs.readFileSync(path.join(ROOT, "data/cadastre-minier-titres.csv"));
const rows = parse(csvRaw, {
  columns: true,
  skip_empty_lines: true,
  bom: true,
});
console.log(`Cadastre minier : ${rows.length} titres miniers`);

const uraniumFeatures = [];
let skipNoGeom = 0;
let skipParse = 0;
for (const r of rows) {
  const subs = (r.substances || "").toLowerCase();
  if (!/uranium/.test(subs)) continue;
  const g = r.geojson;
  if (!g || g === "null") {
    skipNoGeom++;
    continue;
  }
  let geom;
  try {
    geom = JSON.parse(g);
  } catch {
    skipParse++;
    continue;
  }
  if (!geom || !geom.coordinates) {
    skipNoGeom++;
    continue;
  }

  // Réduit aux propriétés utiles pour la popup
  uraniumFeatures.push({
    type: "Feature",
    geometry: geom,
    properties: {
      nom: r.nom,
      type: r.type, // permis d'exploitation, concession, etc.
      statut: r.statut, // valide / clos / instruction…
      substances: r.substances,
      titulaire: (r["titulaires_noms"] || "").split(";")[0] || null,
      departements: r.departements,
    },
  });
}
console.log(
  `Uranium : ${uraniumFeatures.length} sites (${skipNoGeom} sans géom, ${skipParse} erreurs)`,
);

// Pour la viz "points", on convertit chaque feature en un point au centroïde.
// Plus lisible qu'un polygone sur la carte choroplèthe — et on garde le détail
// au clic.
function centroid(coords) {
  let sx = 0,
    sy = 0,
    n = 0;
  function walk(c) {
    if (typeof c[0] === "number") {
      sx += c[0];
      sy += c[1];
      n++;
    } else c.forEach(walk);
  }
  walk(coords);
  return n > 0 ? [sx / n, sy / n] : null;
}

const uraniumPoints = {
  type: "FeatureCollection",
  features: uraniumFeatures
    .map((f) => {
      const c = centroid(f.geometry.coordinates);
      if (!c) return null;
      return {
        type: "Feature",
        geometry: { type: "Point", coordinates: [Math.round(c[0] * 1e4) / 1e4, Math.round(c[1] * 1e4) / 1e4] },
        properties: f.properties,
      };
    })
    .filter(Boolean),
};

fs.writeFileSync(path.join(OUT, "uranium.geojson"), JSON.stringify(uraniumPoints));
console.log(
  `→ uranium.geojson : ${uraniumPoints.features.length} points (${(fs.statSync(path.join(OUT, "uranium.geojson")).size / 1024).toFixed(0)} KB)`,
);

// --- 2. VOLCANISME : centres volcaniques majeurs (curaté) ---
// Sources : BRGM cartes 1/1M ; Wikipédia ; IRSN cofacteurs radon.
// Coordonnées WGS84 approximatives (centre du massif).
const volcans = [
  {
    nom: "Chaîne des Puys",
    region: "Auvergne",
    type: "Champ de volcans monogéniques",
    age: "Quaternaire (95k - 8k ans)",
    coords: [2.97, 45.78],
    note: "80 volcans alignés N-S, basaltes & trachyandésites — UNESCO 2018",
  },
  {
    nom: "Massif du Mont-Dore — Sancy",
    region: "Auvergne",
    type: "Stratovolcan érodé",
    age: "5,1 - 0,2 Ma",
    coords: [2.81, 45.55],
    note: "Phonolites alcalines, roches U-Th — sommet Puy de Sancy (1 886 m)",
  },
  {
    nom: "Cantal",
    region: "Auvergne",
    type: "Plus grand stratovolcan d'Europe",
    age: "13 - 2,1 Ma",
    coords: [2.76, 45.05],
    note: "70 km de diamètre, basaltes & trachytes",
  },
  {
    nom: "Cézallier",
    region: "Auvergne",
    type: "Plateau basaltique",
    age: "7,5 - 3 Ma",
    coords: [2.85, 45.4],
    note: "Vastes coulées de lave, eaux thermales associées",
  },
  {
    nom: "Aubrac",
    region: "Aveyron / Lozère",
    type: "Plateau basaltique",
    age: "9 - 6 Ma",
    coords: [3.0, 44.66],
    note: "Coulées basaltiques étendues",
  },
  {
    nom: "Velay",
    region: "Haute-Loire",
    type: "Province volcanique",
    age: "13 - 0,5 Ma",
    coords: [4.1, 45.05],
    note: "Mont-Bar, dernier volcan en activité de France métropolitaine",
  },
  {
    nom: "Devès",
    region: "Haute-Loire",
    type: "Plateau basaltique",
    age: "3,5 - 0,7 Ma",
    coords: [3.75, 44.95],
    note: "Plus de 150 cônes stromboliens",
  },
  {
    nom: "Coirons / Vivarais",
    region: "Ardèche",
    type: "Plateau et chaîne basaltique",
    age: "8 - 30k ans (Lac Pavin équivalent en Vivarais : ~30k ans)",
    coords: [4.55, 44.65],
    note: "Volcanisme le plus récent de France",
  },
];

const volcanGeoJSON = {
  type: "FeatureCollection",
  features: volcans.map((v) => ({
    type: "Feature",
    geometry: { type: "Point", coordinates: v.coords },
    properties: {
      nom: v.nom,
      region: v.region,
      typeVolc: v.type,
      age: v.age,
      note: v.note,
    },
  })),
};

fs.writeFileSync(path.join(OUT, "volcanism.geojson"), JSON.stringify(volcanGeoJSON, null, 2));
console.log(`→ volcanism.geojson : ${volcanGeoJSON.features.length} centres volcaniques`);
