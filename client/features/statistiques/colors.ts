/* ── Color palettes for year-based charts ── */

export const YEAR_BG = [
  "bg-brand-600", "bg-sky-500", "bg-amber-500", "bg-emerald-500",
  "bg-rose-500", "bg-violet-500", "bg-orange-500", "bg-teal-500",
];

export const YEAR_HEX = [
  "#2563eb", "#0ea5e9", "#f59e0b", "#10b981",
  "#f43f5e", "#8b5cf6", "#f97316", "#14b8a6",
];

/** Stable color index for a year based on the global allYears list */
export function yearColorIndex(year: number, allYears: number[]): number {
  const idx = allYears.indexOf(year);
  return idx >= 0 ? idx : 0;
}
