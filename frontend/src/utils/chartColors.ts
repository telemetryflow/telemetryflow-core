/**
 * Global chart color palette — 100 distinct colors for series rotation.
 * Used by VM graphs, Agent graphs, K8s graphs, and any multi-series chart.
 *
 * Colors are INTERLEAVED across 10 hue families (Blue, Green, Amber, Red,
 * Purple, Cyan, Orange, Pink, Teal, Indigo) so that consecutive series
 * indices are always visually distinct — no two adjacent series share a hue.
 *
 * Layout: 10 rounds × 10 hue families = 100 colors
 *   Round 0: primary shades   (vivid, ~500)
 *   Round 1: darker shades    (~600-700)
 *   Round 2: lighter shades   (~400)
 *   Round 3: very light       (~300)
 *   Round 4: deep shades      (~700-800)
 *   Round 5: very deep        (~800-900)
 *   Round 6: extra light      (~100)
 *   Round 7: shifted hues     (adjacent hue families)
 *   Round 8: muted midtones   (slightly desaturated)
 *   Round 9: soft pastels     (gentle, high-lightness)
 */
export const SERIES_COLORS = [
  // ── Round 0: primary (vivid ~500) ────────────────────────────────────────
  "#3b82f6", // blue
  "#22c55e", // green
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // purple
  "#06b6d4", // cyan
  "#f97316", // orange
  "#ec4899", // pink
  "#14b8a6", // teal
  "#6366f1", // indigo

  // ── Round 1: darker shades (~600-700) ────────────────────────────────────
  "#1d4ed8", // blue-700
  "#16a34a", // green-600
  "#d97706", // amber-600
  "#dc2626", // red-600
  "#7c3aed", // purple-600
  "#0891b2", // cyan-600
  "#ea580c", // orange-600
  "#db2777", // pink-600
  "#0d9488", // teal-600
  "#4f46e5", // indigo-600

  // ── Round 2: lighter shades (~400) ───────────────────────────────────────
  "#60a5fa", // blue-400
  "#4ade80", // green-400
  "#fbbf24", // amber-400
  "#f87171", // red-400
  "#a78bfa", // purple-400
  "#22d3ee", // cyan-400
  "#fb923c", // orange-400
  "#f472b6", // pink-400
  "#2dd4bf", // teal-400
  "#818cf8", // indigo-400

  // ── Round 3: very light (~300) ───────────────────────────────────────────
  "#93c5fd", // blue-300
  "#86efac", // green-300
  "#fde68a", // amber-300
  "#fca5a5", // red-300
  "#c4b5fd", // purple-300
  "#67e8f9", // cyan-300
  "#fdba74", // orange-300
  "#f9a8d4", // pink-300
  "#5eead4", // teal-300
  "#a5b4fc", // indigo-300

  // ── Round 4: deep shades (~700-800) ──────────────────────────────────────
  "#1e40af", // blue-800
  "#15803d", // green-700
  "#b45309", // amber-700
  "#b91c1c", // red-700
  "#6d28d9", // purple-700
  "#0e7490", // cyan-700
  "#c2410c", // orange-700
  "#be185d", // pink-700
  "#0f766e", // teal-700
  "#4338ca", // indigo-700

  // ── Round 5: very deep (~800-900) ────────────────────────────────────────
  "#1e3a8a", // blue-900
  "#14532d", // green-900
  "#92400e", // amber-800
  "#7f1d1d", // red-900
  "#4c1d95", // purple-900
  "#164e63", // cyan-900
  "#7c2d12", // orange-900
  "#831843", // pink-900
  "#134e4a", // teal-900
  "#312e81", // indigo-900

  // ── Round 6: extra light (~100) ──────────────────────────────────────────
  "#dbeafe", // blue-100
  "#dcfce7", // green-100
  "#fef3c7", // amber-100
  "#fee2e2", // red-100
  "#ede9fe", // purple-100
  "#cffafe", // cyan-100
  "#ffedd5", // orange-100
  "#fce7f3", // pink-100
  "#ccfbf1", // teal-100
  "#e0e7ff", // indigo-100

  // ── Round 7: adjacent / shifted hue families ─────────────────────────────
  "#0ea5e9", // sky-500      (blue → cyan shift)
  "#84cc16", // lime-500     (green → yellow shift)
  "#eab308", // yellow-500   (amber → warm shift)
  "#f43f5e", // rose-500     (red → pink shift)
  "#7c5cfc", // violet       (purple → blue shift)
  "#38bdf8", // sky-400      (cyan → light-blue shift)
  "#ff5722", // deep-orange  (orange → red shift)
  "#e879f9", // fuchsia-400  (pink → magenta shift)
  "#00c9a7", // spring-green (teal → bright shift)
  "#5c6bc0", // blue-grey    (indigo → slate shift)

  // ── Round 8: muted midtones (slightly desaturated) ───────────────────────
  "#4d7cc7", // blue-muted
  "#3da858", // green-muted
  "#c99016", // amber-muted
  "#cc3333", // red-muted
  "#8855cc", // purple-muted
  "#1aa8c0", // cyan-muted
  "#d86018", // orange-muted
  "#cc3377", // pink-muted
  "#15a090", // teal-muted
  "#5558cc", // indigo-muted

  // ── Round 9: soft pastels (gentle, high-lightness) ───────────────────────
  "#b8d4fc", // blue-soft
  "#b8f0c8", // green-soft
  "#fce0a0", // amber-soft
  "#fcc0c0", // red-soft
  "#d8c0f8", // purple-soft
  "#b0eaf8", // cyan-soft
  "#fcd0a0", // orange-soft
  "#fcc0e0", // pink-soft
  "#b0f0e8", // teal-soft
  "#c8c8f8", // indigo-soft
] as const;

export type SeriesColor = (typeof SERIES_COLORS)[number];

/** Alias used by VM graph components */
export const VM_COLORS = SERIES_COLORS;

/** Alias used by Agent graph components */
export const AGENT_COLORS = SERIES_COLORS;

/** Alias used by Kubernetes graph components */
export const K8S_COLORS = SERIES_COLORS;

/**
 * Assigns K8S_COLORS to each series in order, cycling through the palette.
 * Use this in any Kubernetes monitoring feature/view to colorise raw time-series data.
 */
export function withK8sColors(
  raw: Array<{ name: string; data: Array<[number, number]>; color?: string }>,
): Array<{ name: string; data: Array<[number, number]>; color?: string }> {
  if (!raw?.length) return [];
  return raw.map((s, i) => ({ ...s, color: K8S_COLORS[i % K8S_COLORS.length] }));
}
