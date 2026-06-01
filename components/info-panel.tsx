"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Logo } from "./logo";
import type { Selected } from "./radon-map";
import { type GlobalStats, formatHabitants } from "@/lib/stats";

const CAT_BADGES = {
  1: { label: "Cat. 1 — faible", color: "bg-[#1e6091]/20 text-[#5fa8d3] ring-[#1e6091]/40" },
  2: { label: "Cat. 2 — moyen", color: "bg-[#f6b21b]/20 text-[#f6b21b] ring-[#f6b21b]/40" },
  3: { label: "Cat. 3 — élevé", color: "bg-[#d63333]/20 text-[#ff6b6b] ring-[#d63333]/40" },
} as const;

export function InfoPanel({
  stats,
  selected,
}: {
  stats: GlobalStats;
  selected: Selected;
}) {
  return (
    <ScrollArea className="h-full">
      <div className="space-y-5 p-5 pb-10">
        {/* Identité / titre */}
        <div>
          <div className="flex items-center gap-2.5">
            <Logo size={26} className="text-foreground" />
            <div className="text-muted-foreground text-[10px] tracking-[0.2em] uppercase">
              Étude — données IRSN / ASNR
            </div>
          </div>
          <h1 className="font-heading mt-3 text-2xl leading-tight font-semibold">
            Le radon en France,
            <br />
            <span className="text-[#ff6b6b]">à quel point c&apos;est dangereux ?</span>
          </h1>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
            Le radon est un gaz radioactif naturel issu de la désintégration de l&apos;uranium
            présent dans le sous-sol. C&apos;est la{" "}
            <strong className="text-foreground">2ᵉ cause de cancer du poumon en France</strong>,
            après le tabac.
          </p>
        </div>

        <Separator />

        {/* Chiffres de dangerosité */}
        <section>
          <h2 className="text-muted-foreground mb-3 text-[11px] font-semibold tracking-widest uppercase">
            Ce que disent les chiffres officiels
          </h2>
          <div className="grid grid-cols-2 gap-2">
            <Stat
              value="≈ 3 000"
              unit="décès / an"
              hint="Cancers du poumon attribués au radon (Santé Publique France, IRSN)"
              alert
            />
            <Stat
              value="10 %"
              unit="des cancers"
              hint="Part des cancers du poumon liés au radon en France"
              alert
            />
            <Stat
              value="300"
              unit="Bq/m³"
              hint="Niveau de référence français au-dessus duquel des travaux sont recommandés"
            />
            <Stat
              value="100"
              unit="Bq/m³"
              hint="Seuil OMS pour la protection de la population générale"
            />
          </div>
          <p className="text-muted-foreground mt-3 text-xs leading-relaxed">
            Le risque est multiplié par environ <strong className="text-foreground">16 % pour
            chaque 100 Bq/m³</strong> d&apos;exposition à long terme. Combiné au tabac, le risque
            devient bien plus que l&apos;addition des deux.
          </p>
        </section>

        <Separator />

        {/* Statistiques nationales (data IRSN) */}
        <section>
          <h2 className="text-muted-foreground mb-3 text-[11px] font-semibold tracking-widest uppercase">
            Sur le territoire français
          </h2>
          <Card className="border-border/60 bg-card/60">
            <CardContent className="space-y-3">
              <div className="text-muted-foreground text-xs">
                Sur <strong className="text-foreground">{stats.total.toLocaleString("fr-FR")}</strong>{" "}
                communes analysées :
              </div>
              <CatBar
                cat={1}
                pct={stats.pctC1}
                count={stats.c1}
                label="Potentiel faible"
              />
              <CatBar
                cat={2}
                pct={stats.pctC2}
                count={stats.c2}
                label="Potentiel moyen"
              />
              <CatBar
                cat={3}
                pct={stats.pctC3}
                count={stats.c3}
                label="Potentiel élevé"
              />
              <div className="text-muted-foreground border-border/40 border-t pt-3 text-xs">
                ≈ <strong className="text-foreground">1 commune sur 5</strong> est classée à
                potentiel <em>élevé</em>.
              </div>
              <div className="text-foreground text-xs leading-relaxed">
                Ramené à la <strong>population</strong> :{" "}
                <strong className="text-[#ff6b6b] font-mono">
                  {formatHabitants(stats.population.inCat3)}
                </strong>{" "}
                d&apos;habitants vivent dans une commune classée à potentiel élevé —{" "}
                <strong>{stats.population.pctInCat3.toFixed(1)} %</strong> de la
                population française.
              </div>
              <div className="text-muted-foreground/70 text-[10px] leading-snug">
                Calcul exact : somme des populations INSEE de chaque commune
                classée cat. 3 (pas une estimation par densité moyenne).
              </div>
            </CardContent>
          </Card>
        </section>

        <Separator />

        {/* Sous quelles conditions on est exposé */}
        <section>
          <h2 className="text-muted-foreground mb-3 text-[11px] font-semibold tracking-widest uppercase">
            Sous quelles conditions on est exposé
          </h2>
          <Card className="border-border/60 bg-card/60">
            <CardContent className="space-y-3 text-xs">
              <ExposureRow
                icon="🏠"
                label="Lieu"
                detail="À l'intérieur des bâtiments — surtout sous-sol, rez-de-chaussée et habitats anciens. Le radon s'accumule dans les espaces fermés et mal ventilés."
              />
              <ExposureRow
                icon="⏱"
                label="Durée"
                detail="≈ 16 h / jour passées chez soi en moyenne. L'exposition est cumulative sur la vie entière."
              />
              <ExposureRow
                icon="🪨"
                label="Aggravants"
                detail="Fissures dans les fondations, vides sanitaires, anciennes mines, failles géologiques, captages d'eau souterraine."
              />
              <ExposureRow
                icon="❄️"
                label="Saison"
                detail="L'hiver concentre le radon (fenêtres fermées, chauffage qui aspire l'air du sol). Les pics sont nocturnes."
              />
              <ExposureRow
                icon="🚬"
                label="Tabac"
                detail="Effet multiplicatif : radon + tabac fait pire que les deux additionnés. ≈ 90 % des décès radon sont chez les fumeurs."
              />
            </CardContent>
          </Card>
        </section>

        <Separator />

        {/* Échelle de risque concrète (Bq/m³) */}
        <section>
          <h2 className="text-muted-foreground mb-3 text-[11px] font-semibold tracking-widest uppercase">
            Si je mesure chez moi, à partir de quel chiffre c&apos;est grave ?
          </h2>
          <Card className="border-border/60 bg-card/60">
            <CardContent className="space-y-2.5">
              <RiskLevel
                color="#1e6091"
                range="< 100 Bq/m³"
                level="Faible"
                action="Recommandation OMS atteinte. Maintenir une ventilation régulière."
              />
              <RiskLevel
                color="#3a7ca5"
                range="100 – 300 Bq/m³"
                level="Mesurable"
                action="Risque non négligeable sur la vie entière. Améliorer la ventilation, étancher la dalle."
              />
              <RiskLevel
                color="#f6b21b"
                range="300 – 1 000 Bq/m³"
                level="Significatif"
                action="Niveau de référence ASN dépassé. Travaux recommandés sous 1 an (ventilation mécanique, étanchéité)."
              />
              <RiskLevel
                color="#d63333"
                range="≥ 1 000 Bq/m³"
                level="Élevé"
                action="Action prioritaire. Dans une commune cat. 3, ~6 % des bâtiments dépassent ce seuil."
              />
              <div className="text-muted-foreground/80 border-border/40 border-t pt-2 text-[10px] leading-snug">
                Source : seuils ASN (décret 2018) et OMS. Sur formations
                uranifères, ≈ <strong className="text-foreground">40 %</strong> des
                bâtiments dépassent 100 Bq/m³, ≈{" "}
                <strong className="text-foreground">6 %</strong> dépassent 400.
              </div>
            </CardContent>
          </Card>
        </section>

        <Separator />

        {/* Top départements */}
        <section>
          <h2 className="text-muted-foreground mb-3 text-[11px] font-semibold tracking-widest uppercase">
            Départements les plus exposés
          </h2>
          <p className="text-muted-foreground mb-3 text-xs leading-relaxed">
            Le radon suit la géologie : <strong className="text-foreground">granite, schiste,
            roches volcaniques</strong>. On retrouve l&apos;axe <strong className="text-foreground">Bretagne
            → Massif central → Pyrénées</strong>, plus la Corse et les Vosges.
          </p>
          <div className="space-y-1.5">
            {stats.topDept.slice(0, 10).map((d) => (
              <div
                key={d.code}
                className="bg-card/40 hover:bg-card/70 ring-border/40 rounded-lg px-3 py-2 ring-1 transition"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground font-mono text-[10px]">{d.code}</span>
                    <span className="text-foreground text-xs capitalize">
                      {d.nom.toLowerCase()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#ff6b6b] font-mono text-xs tabular-nums">
                      {(d.pctC3 * 100).toFixed(0)}%
                    </span>
                    <Bar pct={d.pctC3} />
                  </div>
                </div>
                <div className="text-muted-foreground mt-1 flex items-center gap-2 text-[10px]">
                  <span>
                    {formatHabitants(d.pop)} hab. dont{" "}
                    <span className="text-foreground/90 font-mono tabular-nums">
                      {formatHabitants(d.popC3)}
                    </span>{" "}
                    en zone cat. 3
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <Separator />

        {/* Dernière sélection (synchronisée avec le popup carte) */}
        <section>
          <h2 className="text-muted-foreground mb-3 text-[11px] font-semibold tracking-widest uppercase">
            Dernière sélection
          </h2>
          <SelectedCard selected={selected} />
        </section>

        <Separator />

        <section className="text-muted-foreground space-y-2 text-[11px] leading-relaxed">
          <div className="font-semibold tracking-widest uppercase">Sources</div>
          <ul className="list-disc space-y-1 pl-4">
            <li>
              IRSN / ASNR —{" "}
              <a
                className="text-foreground underline-offset-2 hover:underline"
                href="https://www.data.gouv.fr/datasets/connaitre-le-potentiel-radon-de-ma-commune/"
                target="_blank"
                rel="noreferrer"
              >
                Connaître le potentiel radon de ma commune
              </a>{" "}
              (data.gouv.fr, licence ouverte)
            </li>
            <li>
              Santé publique France — Estimations du nombre de décès par cancer du poumon
              attribuables au radon
            </li>
            <li>
              OMS — Handbook on indoor radon: a public health perspective
            </li>
            <li>
              Contours administratifs :{" "}
              <a
                className="text-foreground underline-offset-2 hover:underline"
                href="https://github.com/gregoiredavid/france-geojson"
                target="_blank"
                rel="noreferrer"
              >
                france-geojson
              </a>
            </li>
          </ul>
        </section>
      </div>
    </ScrollArea>
  );
}

function Stat({
  value,
  unit,
  hint,
  alert,
}: {
  value: string;
  unit: string;
  hint: string;
  alert?: boolean;
}) {
  return (
    <Card
      className={`border-border/60 bg-card/60 ${alert ? "ring-1 ring-[#d63333]/25" : ""}`}
    >
      <CardContent className="px-3 py-3">
        <div className={`font-mono text-xl leading-none tabular-nums ${alert ? "text-[#ff6b6b]" : "text-foreground"}`}>
          {value}
        </div>
        <div className="text-foreground/80 mt-0.5 text-[10px] tracking-wide uppercase">
          {unit}
        </div>
        <div className="text-muted-foreground mt-1.5 text-[10px] leading-tight">{hint}</div>
      </CardContent>
    </Card>
  );
}

function CatBar({
  cat,
  pct,
  count,
  label,
}: {
  cat: 1 | 2 | 3;
  pct: number;
  count: number;
  label: string;
}) {
  const colors = {
    1: "#1e6091",
    2: "#f6b21b",
    3: "#d63333",
  };
  // pct est en 0..1 ici (pour les sections dept) ou en pourcent (0..100) si on lui passe stats.pctC*
  const normalized = pct > 1 ? pct / 100 : pct;
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between text-xs">
        <span className="text-foreground/90">{label}</span>
        <span className="text-muted-foreground font-mono tabular-nums">
          {(normalized * 100).toFixed(1)}%{" "}
          <span className="text-muted-foreground/60">· {count.toLocaleString("fr-FR")}</span>
        </span>
      </div>
      <div className="bg-card/60 ring-border/40 h-1.5 overflow-hidden rounded-full ring-1">
        <div
          className="h-full rounded-full"
          style={{ width: `${normalized * 100}%`, background: colors[cat] }}
        />
      </div>
    </div>
  );
}

function Bar({ pct }: { pct: number }) {
  return (
    <div className="bg-card/60 ring-border/40 h-1.5 w-16 overflow-hidden rounded-full ring-1">
      <div
        className="h-full rounded-full bg-[#d63333]"
        style={{ width: `${pct * 100}%` }}
      />
    </div>
  );
}

function ExposureRow({
  icon,
  label,
  detail,
}: {
  icon: string;
  label: string;
  detail: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-base leading-tight" aria-hidden="true">
        {icon}
      </span>
      <div className="flex-1 leading-snug">
        <div className="text-foreground text-[11px] font-semibold tracking-wide uppercase">
          {label}
        </div>
        <div className="text-muted-foreground mt-0.5">{detail}</div>
      </div>
    </div>
  );
}

function RiskLevel({
  color,
  range,
  level,
  action,
}: {
  color: string;
  range: string;
  level: string;
  action: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span
        className="ring-foreground/10 mt-0.5 inline-block h-3 w-3 shrink-0 rounded-sm ring-1"
        style={{ background: color }}
        aria-hidden="true"
      />
      <div className="flex-1 leading-snug">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-foreground font-mono text-xs tabular-nums">{range}</span>
          <span className="text-foreground/70 text-[10px] tracking-wider uppercase">
            {level}
          </span>
        </div>
        <div className="text-muted-foreground mt-0.5 text-[11px]">{action}</div>
      </div>
    </div>
  );
}

function titleCase(s: string) {
  return s
    .toLowerCase()
    .replace(/(^|[\s\-'])(\p{L})/gu, (_, sep: string, c: string) => sep + c.toUpperCase());
}

function SelectedCard({ selected }: { selected: Selected }) {
  if (!selected) {
    return (
      <Card className="border-border/40 bg-card/30">
        <CardContent className="text-muted-foreground py-4 text-center text-xs">
          Cliquez une commune, un département ou un point sur la carte pour voir le détail ici.
        </CardContent>
      </Card>
    );
  }

  if (selected.kind === "commune") {
    const p = selected.props;
    const badge = CAT_BADGES[p.cat];
    const description =
      p.cat === 3
        ? "Sous-sol uranifère (granite, schiste ou volcanique). Test radon recommandé dans l'habitat — surtout au rez-de-chaussée et au sous-sol."
        : p.cat === 2
          ? "Sous-sol peu uranifère, mais des facteurs géologiques locaux (failles, anciennes mines, karst) peuvent concentrer le radon."
          : "Sous-sol pauvre en uranium. Concentrations généralement faibles, mais ventilation toujours conseillée.";
    return (
      <Card className="border-border/60 bg-card/60">
        <CardContent className="space-y-3">
          <div>
            <div className="text-muted-foreground text-[10px] tracking-wider uppercase">
              Commune
            </div>
            <div className="text-foreground text-lg leading-tight font-semibold">{p.n}</div>
            <div className="text-muted-foreground mt-0.5 font-mono text-[10px]">
              INSEE {p.c}
            </div>
          </div>
          <Badge className={`ring-1 ${badge.color}`} variant="secondary">
            {badge.label}
          </Badge>
          <p className="text-muted-foreground text-xs leading-relaxed">{description}</p>
        </CardContent>
      </Card>
    );
  }

  if (selected.kind === "departement") {
    const p = selected.props;
    return (
      <Card className="border-border/60 bg-card/60">
        <CardContent className="space-y-3">
          <div>
            <div className="text-muted-foreground text-[10px] tracking-wider uppercase">
              Département
            </div>
            <div className="text-foreground text-lg leading-tight font-semibold">
              {titleCase(p.nom)}
            </div>
            <div className="text-muted-foreground mt-0.5 font-mono text-[10px]">
              Code {p.code} · {p.total} communes
            </div>
          </div>
          <div className="space-y-2">
            <CatBar cat={1} pct={p.c1 / p.total} count={p.c1} label="faible" />
            <CatBar cat={2} pct={p.c2 / p.total} count={p.c2} label="moyen" />
            <CatBar cat={3} pct={p.c3 / p.total} count={p.c3} label="élevé" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (selected.kind === "uranium") {
    const p = selected.props;
    return (
      <Card className="border-border/60 bg-card/60 ring-1 ring-[#ffd23a]/30">
        <CardContent className="space-y-3">
          <div>
            <div className="text-[10px] tracking-wider uppercase" style={{ color: "#ffd23a" }}>
              ☢ Ancien site uranifère
            </div>
            <div className="text-foreground text-lg leading-tight font-semibold capitalize">
              {p.nom}
            </div>
            <div className="text-muted-foreground mt-0.5 text-[10px]">
              {titleCase(p.type)} · statut <strong className="text-foreground">{p.statut}</strong>
            </div>
          </div>
          <div className="text-muted-foreground space-y-1 text-xs">
            <div>
              <span className="text-foreground/70">Substances</span> · {p.substances}
            </div>
            <div>
              <span className="text-foreground/70">Département(s)</span> · {p.departements}
            </div>
            {p.titulaire && (
              <div>
                <span className="text-foreground/70">Titulaire</span> · {p.titulaire}
              </div>
            )}
          </div>
          <p className="text-muted-foreground border-border/40 border-t pt-3 text-xs leading-relaxed">
            La France a exploité ≈ 250 sites uranifères entre 1948 et 2001. Le radon résiduel
            est l&apos;une des principales préoccupations sanitaires post-fermeture.
          </p>
        </CardContent>
      </Card>
    );
  }

  // volcan
  const p = selected.props;
  return (
    <Card className="border-border/60 bg-card/60 ring-1 ring-[#ff5e3a]/30">
      <CardContent className="space-y-3">
        <div>
          <div className="text-[10px] tracking-wider uppercase" style={{ color: "#ff5e3a" }}>
            ▲ Centre volcanique
          </div>
          <div className="text-foreground text-lg leading-tight font-semibold">{p.nom}</div>
          <div className="text-muted-foreground mt-0.5 text-[10px]">
            {p.typeVolc} · {p.region}
          </div>
        </div>
        <div className="text-muted-foreground space-y-1 text-xs">
          <div>
            <span className="text-foreground/70">Âge</span> · {p.age}
          </div>
          <div className="text-foreground/90 leading-relaxed">{p.note}</div>
        </div>
        <p className="text-muted-foreground border-border/40 border-t pt-3 text-xs leading-relaxed">
          Les laves alcalines (phonolites, trachytes) du Massif central sont enrichies en
          uranium et thorium. Le radon émane via la porosité et les fractures.
        </p>
      </CardContent>
    </Card>
  );
}
