/* ── Pure data functions (no React) ── */

import type { Offer } from "@/features/offres/types";
import type { Dimension, EvoDimData, MonthlyData } from "./types";
import { MONTH_NAMES } from "./types";

export function getYear(dateStr?: string | null): number | null {
  if (!dateStr) return null;
  const y = new Date(dateStr).getFullYear();
  return Number.isNaN(y) ? null : y;
}

export function pct(n: number, total: number) {
  if (total === 0) return "0";
  return ((n / total) * 100).toFixed(1);
}

export function fmtMonthLabel(key: string): string {
  const [y, m] = key.split("-");
  const mi = parseInt(m, 10) - 1;
  return `${MONTH_NAMES[mi] ?? m} ${y}`;
}

export const fmtDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString("fr-CH") : "—";

export function dimValue(o: Offer, dim: Dimension): string {
  switch (dim) {
    case "statut":
      return o.statut || "(vide)";
    case "pays":
      return o.pays || "(vide)";
    case "typeSociete":
      return o.typeSociete || "(vide)";
    case "typeSejour":
      return o.typeSejour || "(vide)";
    case "stationDemandee":
      return o.stationDemandee || "(vide)";
    case "traitePar":
      return o.traitePar || "(vide)";
    case "transmisPar":
      return o.transmisPar || "(vide)";
    case "activitesDemandees":
      return o.activitesDemandees ? "Oui" : "Non";
    case "activiteUniquement":
      return o.activiteUniquement ? "Oui" : "Non";
    case "seminaire":
      return (o.seminaireJournee || o.seminaireDemiJournee) ? "Oui" : "Non";
  }
}

export function buildEvolutionData(offers: Offer[], dim: Dimension): EvoDimData {
  const yearSet = new Set<number>();
  const map: Record<string, Record<number, number>> = {};

  for (const o of offers) {
    const y = getYear(o.dateEnvoiOffre);
    if (!y) continue;
    yearSet.add(y);
    const val = dimValue(o, dim);
    if (!map[val]) map[val] = {};
    map[val][y] = (map[val][y] ?? 0) + 1;
  }

  const years = Array.from(yearSet).sort((a, b) => a - b);
  const rows = Object.entries(map)
    .map(([label, yearCounts]) => {
      const total = years.reduce((s, y) => s + (yearCounts[y] ?? 0), 0);
      return { label, yearCounts, total };
    })
    .sort((a, b) => b.total - a.total);

  const yearTotals: Record<number, number> = {};
  for (const y of years) {
    yearTotals[y] = rows.reduce((s, r) => s + (r.yearCounts[y] ?? 0), 0);
  }

  return { years, rows, yearTotals };
}

export function buildMonthlyData(
  offers: Offer[],
  getDate: (o: Offer) => Date | null,
): MonthlyData {
  const yearSet = new Set<number>();
  const map: Record<number, Record<number, number>> = {};

  for (const o of offers) {
    const d = getDate(o);
    if (!d) continue;
    const m = d.getMonth();
    const y = d.getFullYear();
    yearSet.add(y);
    if (!map[m]) map[m] = {};
    map[m][y] = (map[m][y] ?? 0) + 1;
  }

  const years = Array.from(yearSet).sort((a, b) => a - b);
  const months = Array.from({ length: 12 }, (_, m) => {
    const yearCounts = map[m] ?? {};
    const total = years.reduce((s, y) => s + (yearCounts[y] ?? 0), 0);
    return { month: m, yearCounts, total };
  });

  return { years, months };
}

export function getSejourMonth(o: Offer): number | null {
  if (o.dateConfirmeeDu) {
    const d = new Date(o.dateConfirmeeDu);
    if (!Number.isNaN(d.getTime())) return d.getMonth();
  }
  if (o.dateOptions && o.dateOptions.length > 0 && o.dateOptions[0].du) {
    const d = new Date(o.dateOptions[0].du);
    if (!Number.isNaN(d.getTime())) return d.getMonth();
  }
  return null;
}
