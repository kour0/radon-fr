"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CommuneEntry = {
  k: "c";
  c: string; // INSEE
  n: string; // nom
  d: string; // dept code
  cat: 1 | 2 | 3;
  lng: number;
  lat: number;
  q: string; // nom normalisé
};

type DeptEntry = {
  k: "d";
  c: string; // dept code
  n: string;
  d: string;
  total: number;
  pctC3: number;
  lng: number;
  lat: number;
  q: string;
};

type IndexEntry = CommuneEntry | DeptEntry;

export type FocusTarget = {
  kind: "commune" | "departement";
  code: string;
  lng: number;
  lat: number;
};

const CAT_COLORS = {
  1: "#1e6091",
  2: "#f6b21b",
  3: "#d63333",
} as const;

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function searchIndex(index: IndexEntry[], rawQuery: string, max = 12): IndexEntry[] {
  const q = normalize(rawQuery);
  if (!q) return [];

  const tokens = q.split(" ");
  // Prefix-prefer scoring : un match en tête de chaîne vaut plus qu'au milieu
  type Scored = { e: IndexEntry; s: number };
  const out: Scored[] = [];

  for (const e of index) {
    let score = 0;
    for (const t of tokens) {
      const idx = e.q.indexOf(t);
      if (idx < 0) {
        score = -1;
        break;
      }
      // Bonus si c'est le début du nom ou d'un mot
      if (idx === 0) score += 100;
      else if (e.q[idx - 1] === " ") score += 60;
      else score += 20;
      // Bonus si le match couvre toute la chaîne
      if (e.q === t) score += 200;
      score -= idx * 0.1;
    }
    if (score < 0) continue;
    // Bonus département (moins nombreux, signal fort)
    if (e.k === "d") score += 10;
    out.push({ e, s: score });
  }

  out.sort((a, b) => b.s - a.s);
  return out.slice(0, max).map((x) => x.e);
}

export function SearchBar({
  onFocus,
}: {
  onFocus: (t: FocusTarget) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState<IndexEntry[] | null>(null);
  const [loading, setLoading] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Lazy load au premier ouverture
  useEffect(() => {
    if (!open || index || loading) return;
    setLoading(true);
    fetch("/data/search-index.json")
      .then((r) => r.json() as Promise<IndexEntry[]>)
      .then((data) => setIndex(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open, index, loading]);

  // Raccourci clavier ⌘K / Ctrl+K
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const results = useMemo(() => {
    if (!index) return [];
    return searchIndex(index, query, 12);
  }, [index, query]);

  const handleSelect = (e: IndexEntry) => {
    onFocus({
      kind: e.k === "c" ? "commune" : "departement",
      code: e.c,
      lng: e.lng,
      lat: e.lat,
    });
    setOpen(false);
    setQuery("");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          ref={triggerRef}
          variant="ghost"
          size="sm"
          className="bg-card/70 ring-border/60 text-muted-foreground hover:bg-card hover:text-foreground h-9 gap-2 rounded-xl px-3 ring-1 backdrop-blur-md"
        >
          <svg
            viewBox="0 0 16 16"
            className="h-3.5 w-3.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <circle cx="7" cy="7" r="5" />
            <path d="M11 11l3 3" strokeLinecap="round" />
          </svg>
          <span className="text-xs">Commune ou département…</span>
          <span className="border-border/60 text-muted-foreground ml-1 rounded border px-1.5 py-0.5 font-mono text-[10px]">
            ⌘K
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={6}
        className="w-[360px] p-0"
      >
        <Command shouldFilter={false} className="bg-popover">
          <CommandInput
            value={query}
            onValueChange={setQuery}
            placeholder={loading ? "Chargement de l'index…" : "Tape un nom : Brest, Creuse, Lyon…"}
            disabled={loading}
            autoFocus
          />
          <CommandList className="max-h-[360px]">
            {!loading && query && results.length === 0 && (
              <CommandEmpty>Aucun résultat.</CommandEmpty>
            )}
            {!loading && !query && (
              <CommandEmpty>
                <div className="text-muted-foreground py-4 text-xs">
                  Tape un nom de commune ou département pour le centrer sur la carte.
                </div>
              </CommandEmpty>
            )}
            {results.length > 0 && (
              <CommandGroup>
                {results.map((e) => (
                  <CommandItem
                    key={`${e.k}-${e.c}`}
                    value={`${e.k}-${e.c}-${e.q}`}
                    onSelect={() => handleSelect(e)}
                    className="flex items-center gap-3"
                  >
                    {e.k === "c" ? (
                      <span
                        className="ring-foreground/10 inline-block h-2.5 w-2.5 shrink-0 rounded-full ring-1"
                        style={{ background: CAT_COLORS[e.cat] }}
                      />
                    ) : (
                      <span className="text-foreground/70 inline-block w-2.5 shrink-0 text-center font-mono text-[10px]">
                        ◇
                      </span>
                    )}
                    <div className="flex flex-1 flex-col leading-tight">
                      <span className="text-foreground text-sm capitalize">
                        {e.n.toLowerCase()}
                      </span>
                      <span className="text-muted-foreground text-[10px]">
                        {e.k === "c"
                          ? `Commune · INSEE ${e.c} · Dpt ${e.d}`
                          : `Département ${e.c} · ${(e as DeptEntry).total} communes · ${Math.round(
                              (e as DeptEntry).pctC3 * 100,
                            )}% cat. 3`}
                      </span>
                    </div>
                    <span
                      className={cn(
                        "rounded px-1.5 py-0.5 font-mono text-[10px]",
                        e.k === "c"
                          ? "bg-card text-muted-foreground"
                          : "bg-card text-muted-foreground",
                      )}
                    >
                      {e.k === "c" ? "commune" : "dépt"}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
