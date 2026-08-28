import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Maximize2 } from "lucide-react";
import { WORLD_MAP_CENTROIDS, WORLD_MAP_PATHS, WORLD_MAP_VIEWBOX } from "../../constants/worldMap";
import Button from "../common/Button";

const MAX_MARKERS = 8;
const MARKER_PADDING = 3;

/**
 * Nudges markers apart when their circles would overlap (e.g. Argentina and
 * Uruguay's centroids sit ~25px apart in this projection, closer than two
 * marker radii combined) so every marker stays individually tappable and
 * legible. Small, local adjustments only -- positions stay anchored to the
 * real centroid otherwise, consistent with "ubicación aproximada".
 */
export function resolveOverlaps(markers, iterations = 12) {
  const nodes = markers.map((m) => ({ ...m, x: m.position[0], y: m.position[1] }));

  for (let iter = 0; iter < iterations; iter++) {
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i];
        const b = nodes[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 0.01;
        const minDist = a.radius + b.radius + MARKER_PADDING;
        if (dist < minDist) {
          const overlap = (minDist - dist) / 2;
          const ux = dx / dist;
          const uy = dy / dist;
          a.x -= ux * overlap;
          a.y -= uy * overlap;
          b.x += ux * overlap;
          b.y += uy * overlap;
        }
      }
    }
  }
  return nodes;
}

export default function WorldMapPreview({ countries }) {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(null);

  // Only countries we can actually place on the map (per-country totals
  // come straight from the backend; a handful of disputed territories
  // without a standard ISO code simply have no centroid and are skipped
  // rather than guessed at) and only the top few, so the preview stays
  // legible instead of drowning in markers.
  const markers = useMemo(() => {
    const withPositions = (countries || [])
      .filter((c) => WORLD_MAP_CENTROIDS[c.country])
      .slice(0, MAX_MARKERS)
      .map((c) => ({ ...c, position: WORLD_MAP_CENTROIDS[c.country] }));

    const maxTotal = Math.max(1, ...withPositions.map((m) => m.total));
    const withRadius = withPositions.map((m) => ({
      ...m,
      radius: 10 + (m.total / maxTotal) * 14,
    }));

    return resolveOverlaps(withRadius);
  }, [countries]);

  return (
    <div className="overflow-hidden rounded-2xl border border-gold-500/25 bg-pitch-850">
      <div className="flex items-center justify-between px-4 pt-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-ink-200">Mapa global</p>
          <p className="text-xs text-ink-500">Contactos por país · ubicación aproximada</p>
        </div>
      </div>

      <div className="relative mt-3 px-2">
        <svg viewBox={WORLD_MAP_VIEWBOX} className="h-auto w-full" role="img" aria-label="Mapa mundial de contactos">
          {WORLD_MAP_PATHS.map((p, i) => (
            <path key={i} d={p.d} className="fill-pitch-700 stroke-pitch-600" strokeWidth={0.5} />
          ))}
          {markers.map((m) => {
            const isSelected = selected?.country === m.country;
            return (
              <g
                key={m.country}
                transform={`translate(${m.x}, ${m.y})`}
                className="cursor-pointer"
                onClick={() => setSelected(m)}
              >
                <circle
                  r={m.radius}
                  className={isSelected ? "fill-gold-300" : "fill-gold-400"}
                  fillOpacity={isSelected ? 0.95 : 0.85}
                  stroke="#050705"
                  strokeWidth={1.5}
                />
                <text
                  textAnchor="middle"
                  dominantBaseline="central"
                  pointerEvents="none"
                  className="select-none fill-pitch-950 font-semibold"
                  style={{ fontSize: Math.max(9, m.radius * 0.85) }}
                >
                  {m.total}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="space-y-3 p-4 pt-2">
        {selected ? (
          <div className="flex items-center justify-between rounded-xl border border-gold-500/30 bg-pitch-800 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-ink-100">{selected.country_name}</p>
              <p className="text-xs text-ink-400">{selected.total} contacto(s)</p>
            </div>
            <button
              onClick={() => navigate(`/buscar?q=${encodeURIComponent(selected.country_name)}`)}
              className="text-xs font-semibold text-gold-400"
            >
              Ver contactos
            </button>
          </div>
        ) : (
          <p className="text-xs text-ink-500">Tocá un país para ver el resumen.</p>
        )}

        <Button variant="secondary" className="w-full" onClick={() => navigate("/mapa")}>
          <Maximize2 size={16} /> Ver mapa completo
        </Button>
      </div>
    </div>
  );
}
