"use client";

import { useRef, useState } from "react";
import { RadonMap, type MapApi, type Overlays, type Selected } from "./radon-map";
import { InfoPanel } from "./info-panel";
import { Legend } from "./legend";
import { Logo } from "./logo";
import { SearchBar } from "./search-bar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import type { GlobalStats } from "@/lib/stats";

type View = "communes" | "departements";

export function RadonShell({ stats }: { stats: GlobalStats }) {
  const [view, setView] = useState<View>("communes");
  const [overlays, setOverlays] = useState<Overlays>({
    uranium: true,
    volcanism: false,
  });
  const [selected, setSelected] = useState<Selected>(null);
  const [legendOpen, setLegendOpen] = useState(false);
  const mapApiRef = useRef<MapApi | null>(null);

  return (
    <div className="fixed inset-0 flex bg-[#0a0a0c]">
      <div className="relative h-full flex-1">
        <RadonMap ref={mapApiRef} view={view} overlays={overlays} onSelect={setSelected} />

        {/* Bandeau supérieur — compact sur mobile, étalé sur desktop */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex flex-wrap items-start justify-between gap-2 p-3 sm:gap-3 sm:p-4">
          <div className="flex flex-col gap-2 sm:max-w-[280px] sm:gap-3">
            {/* Titre : logo seul sur mobile, logo + texte sur desktop */}
            <div className="bg-card/70 ring-border/60 pointer-events-auto flex items-center gap-2.5 rounded-xl px-2.5 py-2 ring-1 backdrop-blur-md sm:px-3">
              <Logo size={28} className="text-foreground shrink-0 sm:h-8 sm:w-8" />
              <div className="hidden leading-tight sm:block">
                <div className="text-muted-foreground text-[10px] tracking-[0.18em] uppercase">
                  Carte du radon en France
                </div>
                <div className="text-foreground text-sm font-medium">
                  Potentiel radon · IRSN / ASNR
                </div>
              </div>
            </div>

            {/* Note pédagogique — desktop seulement */}
            <div className="bg-card/60 ring-border/50 text-muted-foreground pointer-events-auto hidden rounded-xl p-3 text-[11px] leading-relaxed ring-1 backdrop-blur-md lg:block">
              <div className="text-foreground mb-1 text-xs font-semibold">
                Pourquoi cette façade ?
              </div>
              Le massif armoricain (Bretagne) et la chaîne pyrénéenne sont des socles
              granitiques riches en uranium. Le radon y est structurellement plus présent
              qu&apos;en plaine sédimentaire (Bassin parisien, Aquitain).
            </div>
          </div>

          {/* Actions à droite : search + toggle vue + bouton mobile sidebar */}
          <div className="pointer-events-auto flex flex-wrap items-center justify-end gap-2">
            <SearchBar onFocus={(t) => mapApiRef.current?.focusOn(t)} />
            <div className="bg-card/70 ring-border/60 flex items-center gap-1 rounded-xl p-1 ring-1 backdrop-blur-md">
              <ViewToggle current={view} value="communes" onChange={setView}>
                <span className="hidden sm:inline">Communes</span>
                <span className="sm:hidden">Comm.</span>
              </ViewToggle>
              <ViewToggle current={view} value="departements" onChange={setView}>
                <span className="hidden sm:inline">Départements</span>
                <span className="sm:hidden">Dépts</span>
              </ViewToggle>
            </div>
            <MobileInfoSheet stats={stats} selected={selected} />
          </div>
        </div>

        {/* Légende — étendue sur desktop, collapsible sur mobile */}
        <div className="pointer-events-none absolute bottom-3 left-3 z-10 sm:bottom-4 sm:left-4">
          <div className="pointer-events-auto sm:hidden">
            {legendOpen ? (
              <div className="relative">
                <Legend
                  view={view}
                  overlays={overlays}
                  onToggleOverlay={(k) => setOverlays((o) => ({ ...o, [k]: !o[k] }))}
                />
                <button
                  type="button"
                  onClick={() => setLegendOpen(false)}
                  aria-label="Fermer la légende"
                  className="bg-card ring-border/60 text-muted-foreground absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full ring-1 backdrop-blur-md"
                >
                  ×
                </button>
              </div>
            ) : (
              <Button
                onClick={() => setLegendOpen(true)}
                variant="ghost"
                size="sm"
                className="bg-card/80 ring-border/60 text-foreground h-9 gap-2 rounded-xl px-3 ring-1 backdrop-blur-md"
              >
                <span className="flex items-center gap-1">
                  <span className="h-2.5 w-2.5 rounded-sm" style={{ background: "#1e6091" }} />
                  <span className="h-2.5 w-2.5 rounded-sm" style={{ background: "#f6b21b" }} />
                  <span className="h-2.5 w-2.5 rounded-sm" style={{ background: "#d63333" }} />
                </span>
                <span className="text-xs">Légende</span>
              </Button>
            )}
          </div>
          <div className="hidden sm:block">
            <Legend
              view={view}
              overlays={overlays}
              onToggleOverlay={(k) => setOverlays((o) => ({ ...o, [k]: !o[k] }))}
            />
          </div>
        </div>
      </div>

      {/* Panneau latéral droit — desktop seulement (>=lg) */}
      <aside className="bg-background border-border/60 hidden h-full w-[380px] shrink-0 border-l lg:flex lg:flex-col">
        <InfoPanel stats={stats} selected={selected} />
      </aside>
    </div>
  );
}

function MobileInfoSheet({
  stats,
  selected,
}: {
  stats: GlobalStats;
  selected: Selected;
}) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="bg-card/70 ring-border/60 text-foreground hover:bg-card h-9 gap-1.5 rounded-xl px-3 ring-1 backdrop-blur-md lg:hidden"
          aria-label="Voir les statistiques et l'étude"
        >
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-3.5 w-3.5">
            <circle cx="8" cy="8" r="6.5" />
            <path d="M8 5v0M8 7v4" strokeLinecap="round" />
          </svg>
          <span className="text-xs">Étude</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="bg-background w-full p-0 sm:max-w-md">
        <SheetTitle className="sr-only">Étude — radon en France</SheetTitle>
        <InfoPanel stats={stats} selected={selected} />
      </SheetContent>
    </Sheet>
  );
}

function ViewToggle({
  current,
  value,
  onChange,
  children,
}: {
  current: View;
  value: View;
  onChange: (v: View) => void;
  children: React.ReactNode;
}) {
  const active = current === value;
  return (
    <Button
      variant={active ? "default" : "ghost"}
      size="sm"
      className={`h-7 px-2.5 text-xs sm:px-3 ${active ? "" : "text-muted-foreground"}`}
      onClick={() => onChange(value)}
    >
      {children}
    </Button>
  );
}
