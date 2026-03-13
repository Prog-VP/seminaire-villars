import type { Offer } from "@/features/offres/types";
import { getEffectiveDates, computeNights, normalizeStatut } from "@/features/offres/utils";
import type {
  OfferStats,
  ProvenanceItem,
  ConfirmedSplit,
} from "./stats-types";
import {
  buildStayMonthDistribution,
  buildMonthlyDistribution,
  buildSeasonSplit,
} from "./period-utils";

// ---------------------------------------------------------------------------
// Re-export everything so existing imports from "./utils" keep working
// ---------------------------------------------------------------------------

export type {
  ProvenanceItem,
  MonthlyDistributionItem,
  SeasonSplit,
  ConfirmedSplit,
  OfferStats,
  AnalyzableField,
  FieldYearDistribution,
} from "./stats-types";

export {
  buildStayMonthDistribution,
  buildMonthlyDistribution,
  buildSeasonSplit,
} from "./period-utils";

export {
  ANALYZABLE_FIELDS,
  buildFieldDistribution,
  buildFieldDistributionByYear,
  getAllLabelsForField,
} from "./field-explorer";

// ---------------------------------------------------------------------------
// Shared helpers (used by both this file and potentially by the sub-modules)
// ---------------------------------------------------------------------------

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

function extractNumber(value?: string | null) {
  if (!value) return null;
  const match = value.replace(",", ".").match(/-?\d+(\.\d+)?/);
  if (!match) return null;
  const parsed = Number.parseFloat(match[0]);
  return Number.isFinite(parsed) ? parsed : null;
}

function computeAverage(values: number[]): number | null {
  if (!values.length) return null;
  const sum = values.reduce((acc, value) => acc + value, 0);
  return sum / values.length;
}

function getStayLengthInNights(offer: Offer): number | null {
  const eff = getEffectiveDates(offer);
  const fromDates = computeNights(eff.du, eff.au);
  if (fromDates !== null) return fromDates;

  if (typeof offer.nombreDeNuits === "string") {
    const parsedFromField = extractNumber(offer.nombreDeNuits);
    if (parsedFromField !== null) return parsedFromField;
  }

  return null;
}

// ---------------------------------------------------------------------------
// Year helpers
// ---------------------------------------------------------------------------

/** Get the reference year for an offer: based on stay date, fallback to createdAt. */
function getOfferYear(offer: Offer): number | null {
  const eff = getEffectiveDates(offer);
  const stayDate = parseDate(eff.du);
  if (stayDate) return stayDate.getFullYear();
  const created = parseDate(offer.createdAt);
  return created ? created.getFullYear() : null;
}

export function filterOffersByYear(offers: Offer[], year: number | null): Offer[] {
  if (year === null) return offers;
  return offers.filter((offer) => getOfferYear(offer) === year);
}

export function getAvailableYears(offers: Offer[]): number[] {
  const years = new Set<number>();
  for (const offer of offers) {
    const year = getOfferYear(offer);
    if (year !== null) years.add(year);
  }
  return Array.from(years).sort((a, b) => b - a);
}

// ---------------------------------------------------------------------------
// Grouping helpers
// ---------------------------------------------------------------------------

function buildGroupedItems(
  offers: Offer[],
  accessor: (offer: Offer) => string | undefined,
  totalOffers: number,
): ProvenanceItem[] {
  const counts = new Map<string, number>();

  for (const offer of offers) {
    const label = normalizeLabel(accessor(offer));
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([label, count]) => ({
      label,
      count,
      percentage: totalOffers > 0 ? (count / totalOffers) * 100 : 0,
    }))
    .sort((a, b) => b.count - a.count);
}

function buildConfirmedSplit(offers: Offer[]): ConfirmedSplit {
  let hebergement = 0;
  let activite = 0;
  for (const offer of offers) {
    if (normalizeStatut(offer.statut) !== "Confirmé") continue;
    if (offer.activiteUniquement) {
      activite += 1;
    } else {
      hebergement += 1;
    }
  }
  return { hebergement, activite };
}

// ---------------------------------------------------------------------------
// Main stats builder
// ---------------------------------------------------------------------------

export function buildOfferStats(offers: Offer[]): OfferStats {
  const totalOffers = offers.length;

  const provenance = buildGroupedItems(offers, (o) => o.pays, totalOffers);
  const transmitters = buildGroupedItems(offers, (o) => o.transmisPar, totalOffers);
  const typeBreakdown = buildGroupedItems(offers, (o) => o.typeSejour, totalOffers);
  const confirmedSplit = buildConfirmedSplit(offers);
  const totalHotelResponses = offers.reduce(
    (sum, o) => sum + (o.hotelResponses?.length ?? 0),
    0,
  );

  const stayLengths = offers
    .map(getStayLengthInNights)
    .filter((value): value is number => typeof value === "number");
  const averageStayLength = computeAverage(stayLengths);

  const groupSizes = offers
    .map((offer) => (typeof offer.nombrePax === "number" ? offer.nombrePax : null))
    .filter((value): value is number => typeof value === "number" && value > 0);
  const averageGroupSize = computeAverage(groupSizes);

  const stayMonthDistribution = buildStayMonthDistribution(offers);

  const {
    monthlyDistribution,
    offersWithSendDate,
  } = buildMonthlyDistribution(offers);

  const seasonSplit = buildSeasonSplit(offers);

  return {
    totalOffers,
    offersWithSendDate,
    provenance,
    transmitters,
    typeBreakdown,
    confirmedSplit,
    totalHotelResponses,
    averageStayLength,
    averageGroupSize,
    stayMonthDistribution,
    monthlyDistribution,
    seasonSplit,
  };
}
