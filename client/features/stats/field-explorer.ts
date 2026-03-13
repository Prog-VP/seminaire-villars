import type { Offer } from "@/features/offres/types";
import { getEffectiveDates, normalizeStatut } from "@/features/offres/utils";
import type { AnalyzableField, FieldYearDistribution } from "./stats-types";

function parseDate(value?: string | null) {
  if (!value) return null;

  const dateOnlyMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (dateOnlyMatch) {
    const [, year, month, day] = dateOnlyMatch;
    const parsed = new Date(
      Date.UTC(
        Number.parseInt(year, 10),
        Number.parseInt(month, 10) - 1,
        Number.parseInt(day, 10)
      )
    );
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function normalizeLabel(value?: string | null) {
  if (!value) return "Non renseigné";
  const trimmed = value.trim();
  return trimmed ? capitalizeFirst(trimmed) : "Non renseigné";
}

function capitalizeFirst(value: string) {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function getOfferYear(offer: Offer): number | null {
  const eff = getEffectiveDates(offer);
  const stayDate = parseDate(eff.du);
  if (stayDate) return stayDate.getFullYear();
  const created = parseDate(offer.createdAt);
  return created ? created.getFullYear() : null;
}

export const ANALYZABLE_FIELDS: AnalyzableField[] = [
  { key: "pays", label: "Pays", accessor: (o) => o.pays || "Non renseigné" },
  { key: "typeSociete", label: "Type de société", accessor: (o) => o.typeSociete || "Non renseigné" },
  { key: "langue", label: "Langue", accessor: (o) => o.langue || "Non renseigné" },
  { key: "typeSejour", label: "Type de séjour", accessor: (o) => o.typeSejour || "Non renseigné" },
  { key: "stationDemandee", label: "Station demandée", accessor: (o) => o.stationDemandee || "Non renseigné" },
  { key: "categorieHotel", label: "Catégorie d'hôtel", accessor: (o) => o.categorieHotel || "Non renseigné" },
  { key: "transmisPar", label: "Transmis par", accessor: (o) => o.transmisPar || "Non renseigné" },
  { key: "traitePar", label: "Traité par", accessor: (o) => o.traitePar || "Non renseigné" },
  { key: "statut", label: "Statut", accessor: (o) => normalizeStatut(o.statut) },
  {
    key: "activiteUniquement",
    label: "Activité uniquement",
    accessor: (o) => (o.activiteUniquement ? "Oui" : "Non"),
  },
  {
    key: "seminaire",
    label: "Séminaire",
    accessor: (o) => (o.seminaire ? "Oui" : "Non"),
  },
];

export function buildFieldDistributionByYear(
  offers: Offer[],
  accessor: (offer: Offer) => string,
): FieldYearDistribution[] {
  // Group offers by stay year (fallback to createdAt)
  const byYear = new Map<number, Offer[]>();
  for (const offer of offers) {
    const year = getOfferYear(offer);
    if (year === null) continue;
    const list = byYear.get(year) ?? [];
    list.push(offer);
    byYear.set(year, list);
  }

  return Array.from(byYear.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([year, yearOffers]) => {
      const total = yearOffers.length;
      const counts = new Map<string, number>();
      for (const offer of yearOffers) {
        const label = normalizeLabel(accessor(offer));
        counts.set(label, (counts.get(label) ?? 0) + 1);
      }
      const values = Array.from(counts.entries())
        .map(([label, count]) => ({
          label,
          count,
          percentage: total > 0 ? (count / total) * 100 : 0,
        }))
        .sort((a, b) => b.count - a.count);
      return { year, total, values };
    });
}

export function buildFieldDistribution(
  offers: Offer[],
  accessor: (offer: Offer) => string,
): { label: string; count: number; percentage: number }[] {
  const total = offers.length;
  const counts = new Map<string, number>();
  for (const offer of offers) {
    const label = normalizeLabel(accessor(offer));
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([label, count]) => ({
      label,
      count,
      percentage: total > 0 ? (count / total) * 100 : 0,
    }))
    .sort((a, b) => b.count - a.count);
}

/** Collect all unique value labels across all years, sorted by global frequency. */
export function getAllLabelsForField(
  distributions: FieldYearDistribution[],
): string[] {
  const globalCounts = new Map<string, number>();
  for (const dist of distributions) {
    for (const v of dist.values) {
      globalCounts.set(v.label, (globalCounts.get(v.label) ?? 0) + v.count);
    }
  }
  return Array.from(globalCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([label]) => label);
}
