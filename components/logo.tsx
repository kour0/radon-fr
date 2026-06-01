// Logo "Rn" — anneau composé de 3 arcs colorés représentant les 3 catégories
// de potentiel radon (faible bleu / moyen ambre / élevé rouge), avec
// l'élément chimique Rn (radon, Z=86) au centre.
//
// La circonférence d'un cercle de rayon 14 ≈ 87.96. Chaque arc occupe ~26
// unités (110°), séparé par ~3.3 unités de gap (~13.5°). Posé sur 3 cercles
// concentriques avec un stroke-dashoffset progressif pour positionner chaque
// segment.
const CIRC = 2 * Math.PI * 14;
const ARC = CIRC / 3 - 3.5; // longueur visible
const GAP = CIRC - ARC;
const STEP = CIRC / 3;

export function Logo({
  size = 28,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label="Logo Radon — Carte du potentiel radon en France"
    >
      <g transform="rotate(-90 16 16)" fill="none" strokeWidth={2.6} strokeLinecap="round">
        <circle
          cx="16"
          cy="16"
          r="14"
          stroke="#1e6091"
          strokeDasharray={`${ARC} ${GAP}`}
          strokeDashoffset={0}
        />
        <circle
          cx="16"
          cy="16"
          r="14"
          stroke="#f6b21b"
          strokeDasharray={`${ARC} ${GAP}`}
          strokeDashoffset={-STEP}
        />
        <circle
          cx="16"
          cy="16"
          r="14"
          stroke="#d63333"
          strokeDasharray={`${ARC} ${GAP}`}
          strokeDashoffset={-2 * STEP}
        />
      </g>
      <text
        x="16"
        y="20.6"
        textAnchor="middle"
        fontSize="11.5"
        fontWeight={600}
        fontFamily="var(--font-sans, system-ui)"
        fill="currentColor"
        letterSpacing="-0.02em"
      >
        Rn
      </text>
    </svg>
  );
}
