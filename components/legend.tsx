"use client";

import { cn } from "@/lib/utils";
import type { Overlays } from "./radon-map";

type View = "communes" | "departements";

export type OverlayKey = keyof Overlays;

const URANIUM_COLOR = "#ffd23a";
const VOLCAN_COLOR = "#ff5e3a";

export function Legend({
  view,
  overlays,
  onToggleOverlay,
}: {
  view: View;
  overlays: Overlays;
  onToggleOverlay: (k: OverlayKey) => void;
}) {
  return (
    <div className="bg-card/80 ring-border/60 pointer-events-auto w-[230px] rounded-xl p-3 ring-1 backdrop-blur-md">
      <div className="text-muted-foreground mb-2 text-[10px] font-medium tracking-wider uppercase">
        {view === "communes" ? "Potentiel radon par commune" : "% de communes en cat. 3"}
      </div>
      {view === "communes" ? (
        <div className="space-y-1.5">
          <LegendRow color="#1e6091" label="Catégorie 1 — faible" hint="Sous-sol pauvre en uranium" />
          <LegendRow color="#f6b21b" label="Catégorie 2 — moyen" hint="Facteurs aggravants (failles…)" />
          <LegendRow color="#d63333" label="Catégorie 3 — élevé" hint="Granite, volcanique, schiste" />
        </div>
      ) : (
        <div>
          <div className="flex h-2 w-full overflow-hidden rounded-full">
            {GRADIENT_STOPS.map((c, i) => (
              <div key={i} className="flex-1" style={{ background: c }} />
            ))}
          </div>
          <div className="text-muted-foreground mt-1.5 flex justify-between text-[10px]">
            <span>0 %</span>
            <span>50 %</span>
            <span>100 %</span>
          </div>
        </div>
      )}

      <div className="border-border/40 mt-3 border-t pt-3">
        <div className="text-muted-foreground mb-1.5 text-[10px] font-medium tracking-wider uppercase">
          Couches corrélées
        </div>
        <div className="space-y-1">
          <OverlayToggle
            active={overlays.uranium}
            onToggle={() => onToggleOverlay("uranium")}
            color={URANIUM_COLOR}
            shape="dot"
            label="Anciens sites d'uranium"
            hint="Mines / concessions (cadastre)"
          />
          <OverlayToggle
            active={overlays.volcanism}
            onToggle={() => onToggleOverlay("volcanism")}
            color={VOLCAN_COLOR}
            shape="dot"
            label="Pôles volcaniques"
            hint="Massif central — roches U-Th"
          />
        </div>
      </div>
    </div>
  );
}

const GRADIENT_STOPS = ["#1e6091", "#3a7ca5", "#f6b21b", "#e8743b", "#d63333", "#8c1818"];

function LegendRow({
  color,
  label,
  hint,
  className,
}: {
  color: string;
  label: string;
  hint?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start gap-2", className)}>
      <span
        className="ring-foreground/10 mt-0.5 inline-block h-3 w-3 shrink-0 rounded-sm ring-1"
        style={{ background: color }}
      />
      <div className="flex flex-col leading-tight">
        <span className="text-foreground text-xs">{label}</span>
        {hint && <span className="text-muted-foreground text-[10px]">{hint}</span>}
      </div>
    </div>
  );
}

function OverlayToggle({
  active,
  onToggle,
  color,
  shape,
  label,
  hint,
}: {
  active: boolean;
  onToggle: () => void;
  color: string;
  shape: "dot" | "triangle";
  label: string;
  hint?: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={active}
      className={cn(
        "ring-border/40 hover:bg-card/70 group flex w-full items-start gap-2 rounded-md px-1.5 py-1 text-left ring-1 transition",
        active ? "bg-card/60" : "bg-transparent opacity-65 hover:opacity-100",
      )}
    >
      <span
        className="relative mt-1 inline-block h-3 w-3 shrink-0"
        aria-hidden="true"
      >
        {/* halo */}
        <span
          className="absolute inset-[-3px] rounded-full"
          style={{ background: color, opacity: active ? 0.25 : 0, filter: "blur(2px)" }}
        />
        <span
          className={cn(
            "absolute inset-0 ring-1 ring-black/40",
            shape === "dot" ? "rounded-full" : "rounded-sm",
          )}
          style={{ background: color }}
        />
      </span>
      <div className="flex flex-1 flex-col leading-tight">
        <span className="text-foreground text-xs">{label}</span>
        {hint && <span className="text-muted-foreground text-[10px]">{hint}</span>}
      </div>
      <span
        className={cn(
          "mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-[5px] border transition",
          active
            ? "border-foreground/70 bg-foreground"
            : "border-foreground/30 bg-transparent",
        )}
        aria-hidden="true"
      >
        {active && (
          <svg viewBox="0 0 10 10" className="text-background h-2.5 w-2.5">
            <path
              d="M2 5.2L4.2 7.4L8 3.4"
              stroke="currentColor"
              strokeWidth="1.8"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>
    </button>
  );
}
