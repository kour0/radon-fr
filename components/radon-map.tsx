"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import maplibregl, { type Map, type MapGeoJSONFeature, Popup } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

export type MapApi = {
  /** Centre la carte sur (lng, lat) avec un zoom et déclenche la popup associée. */
  focusOn: (params: {
    kind: "commune" | "departement";
    code: string;
    lng: number;
    lat: number;
  }) => void;
};

type View = "communes" | "departements";

export type Overlays = {
  uranium: boolean;
  volcanism: boolean;
};

type CommuneFeatureProps = {
  c: string;
  n: string;
  d: string;
  cat: 1 | 2 | 3;
};

type DepartementFeatureProps = {
  code: string;
  nom: string;
  total: number;
  c1: number;
  c2: number;
  c3: number;
  pctC3: number;
};

type UraniumFeatureProps = {
  nom: string;
  type: string;
  statut: string;
  substances: string;
  titulaire: string | null;
  departements: string;
};

type VolcanFeatureProps = {
  nom: string;
  region: string;
  typeVolc: string;
  age: string;
  note: string;
};

export type Selected =
  | { kind: "commune"; props: CommuneFeatureProps }
  | { kind: "departement"; props: DepartementFeatureProps }
  | { kind: "uranium"; props: UraniumFeatureProps }
  | { kind: "volcan"; props: VolcanFeatureProps }
  | null;

const CAT_COLORS = {
  1: "#1e6091",
  2: "#f6b21b",
  3: "#d63333",
} as const;

const CAT_META = {
  1: { label: "Cat. 1 — faible", hint: "Sous-sol pauvre en uranium" },
  2: { label: "Cat. 2 — moyen", hint: "Facteurs aggravants locaux" },
  3: { label: "Cat. 3 — élevé", hint: "Granite, schiste, volcanique" },
} as const;

const URANIUM_COLOR = "#ffd23a"; // jaune uranium
const VOLCAN_COLOR = "#ff5e3a"; // orange lave

const BASE_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
  sources: {},
  layers: [
    {
      id: "background",
      type: "background",
      paint: { "background-color": "#0a0a0c" },
    },
  ],
};

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function titleCase(s: string): string {
  return s
    .toLowerCase()
    .replace(/(^|[\s\-'])(\p{L})/gu, (_, sep: string, c: string) => sep + c.toUpperCase());
}

function communePopupHTML(p: CommuneFeatureProps): string {
  const meta = CAT_META[p.cat];
  const color = CAT_COLORS[p.cat];
  return `
    <div class="radon-popup">
      <div class="radon-popup-eyebrow">Commune · INSEE ${esc(p.c)}</div>
      <div class="radon-popup-title">${esc(p.n)}</div>
      <div class="radon-popup-badge" style="--cat:${color}">
        <span class="radon-popup-dot" style="background:${color}"></span>
        ${meta.label}
      </div>
      <div class="radon-popup-hint">${meta.hint}</div>
    </div>
  `;
}

function deptPopupHTML(p: DepartementFeatureProps): string {
  const pct = (n: number) => `${((n / p.total) * 100).toFixed(1)}%`;
  const bar = (cat: 1 | 2 | 3, count: number) => {
    const ratio = p.total > 0 ? (count / p.total) * 100 : 0;
    return `
      <div class="radon-popup-row">
        <div class="radon-popup-row-head">
          <span>${CAT_META[cat].label.split(" — ")[1]}</span>
          <span class="radon-popup-mono">${pct(count)} · ${count.toLocaleString("fr-FR")}</span>
        </div>
        <div class="radon-popup-bar">
          <div class="radon-popup-bar-fill" style="width:${ratio}%; background:${CAT_COLORS[cat]}"></div>
        </div>
      </div>
    `;
  };
  return `
    <div class="radon-popup">
      <div class="radon-popup-eyebrow">Département ${esc(p.code)} · ${p.total} communes</div>
      <div class="radon-popup-title">${esc(titleCase(p.nom))}</div>
      ${bar(1, p.c1)}
      ${bar(2, p.c2)}
      ${bar(3, p.c3)}
    </div>
  `;
}

function uraniumPopupHTML(p: UraniumFeatureProps): string {
  return `
    <div class="radon-popup">
      <div class="radon-popup-eyebrow" style="color:${URANIUM_COLOR}">☢ Ancien site uranium</div>
      <div class="radon-popup-title">${esc(p.nom)}</div>
      <div class="radon-popup-hint">${esc(titleCase(p.type))} · statut <strong>${esc(p.statut)}</strong></div>
      <div class="radon-popup-hint">Département : ${esc(p.departements)}</div>
      ${p.titulaire ? `<div class="radon-popup-hint">Titulaire : ${esc(p.titulaire)}</div>` : ""}
    </div>
  `;
}

function volcanPopupHTML(p: VolcanFeatureProps): string {
  return `
    <div class="radon-popup">
      <div class="radon-popup-eyebrow" style="color:${VOLCAN_COLOR}">▲ Centre volcanique</div>
      <div class="radon-popup-title">${esc(p.nom)}</div>
      <div class="radon-popup-hint"><strong>${esc(p.typeVolc)}</strong> · ${esc(p.region)}</div>
      <div class="radon-popup-hint">Âge : ${esc(p.age)}</div>
      <div class="radon-popup-hint" style="margin-top:6px">${esc(p.note)}</div>
    </div>
  `;
}

export const RadonMap = forwardRef<
  MapApi,
  {
    view: View;
    overlays: Overlays;
    onSelect: (s: Selected) => void;
  }
>(function RadonMap({ view, overlays, onSelect }, apiRef) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const popupRef = useRef<Popup | null>(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const [loaded, setLoaded] = useState(false);

  // Expose une API impérative pour permettre à la SearchBar de centrer + popup
  useImperativeHandle(apiRef, () => ({
    focusOn: ({ kind, code, lng, lat }) => {
      const map = mapRef.current;
      const popup = popupRef.current;
      if (!map || !popup) return;

      const sourceId = kind === "commune" ? "communes" : "departements";
      const targetZoom = kind === "commune" ? 10 : 7.2;
      map.flyTo({ center: [lng, lat], zoom: targetZoom, duration: 1200, essential: true });

      // Une fois la requête de la source possible, on cherche la feature
      // correspondante et on ouvre la popup avec ses propriétés réelles.
      // L'événement `idle` survient après que flyTo + render soient terminés.
      const open = () => {
        const feats = map.querySourceFeatures(sourceId, {
          filter:
            kind === "commune"
              ? ["==", ["get", "c"], code]
              : ["==", ["get", "code"], code],
        });
        const f = feats[0];
        if (!f) return;
        const props = f.properties as Record<string, unknown>;
        if (kind === "commune") {
          const cp = props as unknown as CommuneFeatureProps;
          popup.setLngLat([lng, lat]).setHTML(communePopupHTML(cp)).addTo(map);
          onSelectRef.current({ kind: "commune", props: cp });
        } else {
          const dp = props as unknown as DepartementFeatureProps;
          popup.setLngLat([lng, lat]).setHTML(deptPopupHTML(dp)).addTo(map);
          onSelectRef.current({ kind: "departement", props: dp });
        }
        map.off("idle", open);
      };
      // S'il y a déjà des features rendues, on peut tenter immédiatement ;
      // sinon on attend `idle`.
      map.once("idle", open);
    },
  }));

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: BASE_STYLE,
      center: [-1.5, 46.0],
      zoom: 5.6,
      minZoom: 4,
      maxZoom: 10,
      attributionControl: false,
      pitchWithRotate: false,
      dragRotate: false,
    });

    map.addControl(
      new maplibregl.AttributionControl({
        compact: true,
        customAttribution:
          'Données : <a href="https://www.data.gouv.fr/datasets/connaitre-le-potentiel-radon-de-ma-commune/" target="_blank">IRSN / ASNR</a> · <a href="https://www.data.gouv.fr/datasets/cadastre-minier/" target="_blank">Cadastre minier</a> · <a href="https://github.com/gregoiredavid/france-geojson" target="_blank">france-geojson</a>',
      }),
      "bottom-right",
    );
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");

    const popup = new maplibregl.Popup({
      closeButton: true,
      closeOnClick: false,
      maxWidth: "280px",
      className: "radon-popup-wrap",
      offset: 8,
    });
    popupRef.current = popup;

    map.on("load", async () => {
      const [communes, departements, uranium, volcanism] = await Promise.all([
        fetch("/data/communes.geojson").then((r) => r.json()),
        fetch("/data/departements.geojson").then((r) => r.json()),
        fetch("/data/uranium.geojson").then((r) => r.json()),
        fetch("/data/volcanism.geojson").then((r) => r.json()),
      ]);

      map.addSource("communes", { type: "geojson", data: communes, generateId: true });
      map.addSource("departements", { type: "geojson", data: departements, generateId: true });
      map.addSource("uranium", { type: "geojson", data: uranium, generateId: true });
      map.addSource("volcanism", { type: "geojson", data: volcanism, generateId: true });

      // Choroplèthe communes
      map.addLayer({
        id: "communes-fill",
        type: "fill",
        source: "communes",
        paint: {
          "fill-color": [
            "match", ["get", "cat"],
            1, CAT_COLORS[1], 2, CAT_COLORS[2], 3, CAT_COLORS[3], "#333",
          ],
          "fill-opacity": [
            "case", ["boolean", ["feature-state", "hover"], false], 0.95, 0.82,
          ],
        },
        layout: { visibility: "visible" },
      });
      map.addLayer({
        id: "communes-line",
        type: "line",
        source: "communes",
        paint: { "line-color": "#0a0a0c", "line-width": 0.15, "line-opacity": 0.6 },
        layout: { visibility: "visible" },
      });

      // Choroplèthe départements
      map.addLayer({
        id: "departements-fill",
        type: "fill",
        source: "departements",
        paint: {
          "fill-color": [
            "interpolate", ["linear"], ["get", "pctC3"],
            0, "#1e6091", 0.1, "#3a7ca5", 0.25, "#f6b21b",
            0.5, "#e8743b", 0.75, "#d63333", 1, "#8c1818",
          ],
          "fill-opacity": [
            "case", ["boolean", ["feature-state", "hover"], false], 0.95, 0.82,
          ],
        },
        layout: { visibility: "none" },
      });
      map.addLayer({
        id: "departements-line",
        type: "line",
        source: "departements",
        paint: { "line-color": "#0a0a0c", "line-width": 0.6, "line-opacity": 0.8 },
        layout: { visibility: "none" },
      });

      // Halo + cercle pour les overlays points (au-dessus des choroplèthes)
      // Uranium — jaune avec halo
      map.addLayer({
        id: "uranium-halo",
        type: "circle",
        source: "uranium",
        paint: {
          "circle-radius": 12,
          "circle-color": URANIUM_COLOR,
          "circle-opacity": 0.18,
          "circle-blur": 0.6,
        },
        layout: { visibility: overlays.uranium ? "visible" : "none" },
      });
      map.addLayer({
        id: "uranium-points",
        type: "circle",
        source: "uranium",
        paint: {
          "circle-radius": [
            "case",
            ["boolean", ["feature-state", "hover"], false],
            6,
            4,
          ],
          "circle-color": URANIUM_COLOR,
          "circle-stroke-color": "#1a1300",
          "circle-stroke-width": 1.2,
          "circle-opacity": 1,
        },
        layout: { visibility: overlays.uranium ? "visible" : "none" },
      });

      // Volcans — orange
      map.addLayer({
        id: "volcanism-halo",
        type: "circle",
        source: "volcanism",
        paint: {
          "circle-radius": 18,
          "circle-color": VOLCAN_COLOR,
          "circle-opacity": 0.22,
          "circle-blur": 0.7,
        },
        layout: { visibility: overlays.volcanism ? "visible" : "none" },
      });
      map.addLayer({
        id: "volcanism-points",
        type: "circle",
        source: "volcanism",
        paint: {
          "circle-radius": [
            "case",
            ["boolean", ["feature-state", "hover"], false],
            8,
            6,
          ],
          "circle-color": VOLCAN_COLOR,
          "circle-stroke-color": "#1a0500",
          "circle-stroke-width": 1.5,
          "circle-opacity": 0.95,
        },
        layout: { visibility: overlays.volcanism ? "visible" : "none" },
      });

      let hovered: { source: string; id: number | string } | null = null;
      const setHover = (source: string, id: number | string | undefined, on: boolean) => {
        if (id === undefined) return;
        map.setFeatureState({ source, id }, { hover: on });
      };

      function attachInteractions(
        layerId: string,
        source: string,
        kind: "commune" | "departement" | "uranium" | "volcan",
      ) {
        map.on("mousemove", layerId, (e) => {
          map.getCanvas().style.cursor = "pointer";
          const f = e.features?.[0];
          if (!f || f.id === undefined) return;
          if (hovered) setHover(hovered.source, hovered.id, false);
          hovered = { source, id: f.id };
          setHover(source, hovered.id, true);
        });
        map.on("mouseleave", layerId, () => {
          map.getCanvas().style.cursor = "";
          if (hovered) setHover(hovered.source, hovered.id, false);
          hovered = null;
        });
        map.on("click", layerId, (e) => {
          const f = e.features?.[0] as MapGeoJSONFeature | undefined;
          if (!f) return;
          let html: string;
          let selected: Selected;
          switch (kind) {
            case "commune": {
              const props = f.properties as unknown as CommuneFeatureProps;
              html = communePopupHTML(props);
              selected = { kind: "commune", props };
              break;
            }
            case "departement": {
              const props = f.properties as unknown as DepartementFeatureProps;
              html = deptPopupHTML(props);
              selected = { kind: "departement", props };
              break;
            }
            case "uranium": {
              const props = f.properties as unknown as UraniumFeatureProps;
              html = uraniumPopupHTML(props);
              selected = { kind: "uranium", props };
              break;
            }
            case "volcan": {
              const props = f.properties as unknown as VolcanFeatureProps;
              html = volcanPopupHTML(props);
              selected = { kind: "volcan", props };
              break;
            }
          }
          // Pour les points, ancre la popup au clic ; pour les polygones aussi.
          popup.setLngLat(e.lngLat).setHTML(html).addTo(map);
          onSelectRef.current(selected);
        });
      }

      attachInteractions("communes-fill", "communes", "commune");
      attachInteractions("departements-fill", "departements", "departement");
      attachInteractions("uranium-points", "uranium", "uranium");
      attachInteractions("volcanism-points", "volcanism", "volcan");

      map.resize();
      setLoaded(true);
    });

    const ro = new ResizeObserver(() => map.resize());
    ro.observe(containerRef.current);

    mapRef.current = map;
    return () => {
      ro.disconnect();
      popup.remove();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Bascule communes ↔ départements
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loaded) return;
    popupRef.current?.remove();
    const showCommunes = view === "communes";
    const setVis = (id: string, on: boolean) =>
      map.setLayoutProperty(id, "visibility", on ? "visible" : "none");
    setVis("communes-fill", showCommunes);
    setVis("communes-line", showCommunes);
    setVis("departements-fill", !showCommunes);
    setVis("departements-line", !showCommunes);
  }, [view, loaded]);

  // Toggles overlays
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loaded) return;
    const setVis = (id: string, on: boolean) =>
      map.setLayoutProperty(id, "visibility", on ? "visible" : "none");
    setVis("uranium-points", overlays.uranium);
    setVis("uranium-halo", overlays.uranium);
    setVis("volcanism-points", overlays.volcanism);
    setVis("volcanism-halo", overlays.volcanism);
  }, [overlays.uranium, overlays.volcanism, loaded]);

  return (
    <>
      <div ref={containerRef} className="h-full w-full" />
      {!loaded && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="rounded-full border border-white/10 bg-black/60 px-4 py-2 text-xs text-white/70 backdrop-blur-md">
            Chargement des données IRSN…
          </div>
        </div>
      )}
    </>
  );
});
