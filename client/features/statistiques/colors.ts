/* ── Color palettes for year-based charts ── */

export const YEAR_BG = [
  "bg-brand-600", "bg-sky-500", "bg-amber-500", "bg-emerald-500",
  "bg-rose-500", "bg-violet-500", "bg-orange-500", "bg-teal-500",
];

/** Fixed color per year — guarantees no two years share a color */
const YEAR_COLOR_MAP: Record<number, string> = {
  2019: "#6366f1", // indigo
  2020: "#14b8a6", // teal
  2021: "#84cc16", // lime
  2022: "#ec4899", // pink
  2023: "#2563eb", // blue
  2024: "#10b981", // emerald
  2025: "#f59e0b", // amber
  2026: "#f43f5e", // rose
  2027: "#8b5cf6", // violet
  2028: "#0ea5e9", // sky
  2029: "#f97316", // orange
  2030: "#06b6d4", // cyan
};

const FALLBACK_COLORS = [
  "#2563eb", "#10b981", "#f59e0b", "#f43f5e",
  "#8b5cf6", "#0ea5e9", "#f97316", "#ec4899",
  "#14b8a6", "#6366f1", "#84cc16", "#06b6d4",
];

export const YEAR_HEX = FALLBACK_COLORS;

/** Get hex color for a year */
export function yearColor(year: number, allYears: number[]): string {
  if (YEAR_COLOR_MAP[year]) return YEAR_COLOR_MAP[year];
  const idx = allYears.indexOf(year);
  return FALLBACK_COLORS[(idx >= 0 ? idx : 0) % FALLBACK_COLORS.length];
}

/** Stable color index for a year based on the global allYears list */
export function yearColorIndex(year: number, allYears: number[]): number {
  const idx = allYears.indexOf(year);
  return idx >= 0 ? idx : 0;
}
