import type { Offer } from "@/features/offres/types";

const MONTH_FORMATTER = new Intl.DateTimeFormat("fr-FR", { month: "long" });
const MS_IN_DAY = 1000 * 60 * 60 * 24;
const SUMMER_SEND_MONTHS = new Set([4, 5, 6, 7, 8, 9, 10]); // May → Nov
const WINTER_SEND_MONTHS = new Set([11, 0, 1, 2, 3]); // Dec → Apr

export type ProvenanceItem = {
  label: string;
  count: number;
  percentage: number;
};

export type MonthlyDistributionItem = {
  monthIndex: number;
  label: string;
  count: number;
  percentage: number;
};

export type SeasonSplit = {
  eteCount: number;
  hiverCount: number;
  shoulderCount: number;
  etePercentage: number;
  hiverPercentage: number;
  shoulderPercentage: number;
  totalConsidered: number;
};

export type OfferStats = {
  totalOffers: number;
  offersWithSendDate: number;
  provenance: ProvenanceItem[];
  averageStayLength: number | null;
  averageGroupSize: number | null;
  monthlyDistribution: MonthlyDistributionItem[];
  seasonSplit: SeasonSplit;
};

export function buildOfferStats(offers: Offer[]): OfferStats {
  const totalOffers = offers.length;

  const provenance = buildProvenance(offers, totalOffers);
  const stayLengths = offers
    .map(getStayLengthInNights)
    .filter((value): value is number => typeof value === "number");
  const averageStayLength = computeAverage(stayLengths);

  const groupSizes = offers
    .map((offer) => (typeof offer.nombrePax === "number" ? offer.nombrePax : null))
    .filter((value): value is number => typeof value === "number" && value > 0);
  const averageGroupSize = computeAverage(groupSizes);

  const {
    monthlyDistribution,
    offersWithSendDate,
  } = buildMonthlyDistribution(offers);

  const seasonSplit = buildSeasonSplit(offers);

  return {
    totalOffers,
    offersWithSendDate,
    provenance,
    averageStayLength,
    averageGroupSize,
    monthlyDistribution,
    seasonSplit,
  };
}

function buildProvenance(
  offers: Offer[],
  totalOffers: number
): ProvenanceItem[] {
  const counts = new Map<string, number>();

  offers.forEach((offer) => {
    const label = normalizeLabel(offer.pays);
    counts.set(label, (counts.get(label) ?? 0) + 1);
  });

  return Array.from(counts.entries())
    .map(([label, count]) => ({
      label,
      count,
      percentage: totalOffers > 0 ? (count / totalOffers) * 100 : 0,
    }))
    .sort((a, b) => b.count - a.count);
}

function buildMonthlyDistribution(offers: Offer[]) {
  const monthlyCounts = new Map<number, number>();
  let offersWithSendDate = 0;

  offers.forEach((offer) => {
    const date = parseDate(offer.dateEnvoiOffre);
    if (!date) return;

    offersWithSendDate += 1;
    const monthIndex = date.getUTCMonth();
    monthlyCounts.set(monthIndex, (monthlyCounts.get(monthIndex) ?? 0) + 1);
  });

  const monthlyDistribution: MonthlyDistributionItem[] = Array.from(
    monthlyCounts.entries()
  )
    .sort((a, b) => a[0] - b[0])
    .map(([monthIndex, count]) => ({
      monthIndex,
      label: capitalizeFirst(
        MONTH_FORMATTER.format(new Date(Date.UTC(2024, monthIndex, 1)))
      ),
      count,
      percentage: offersWithSendDate > 0 ? (count / offersWithSendDate) * 100 : 0,
    }));

  return {
    monthlyDistribution,
    offersWithSendDate,
  };
}

function buildSeasonSplit(offers: Offer[]): SeasonSplit {
  const counts = {
    ete: 0,
    hiver: 0,
    shoulder: 0,
  };

  offers.forEach((offer) => {
    const season = getSeason(offer);
    if (!season) return;
    counts[season] += 1;
  });

  const totalConsidered = counts.ete + counts.hiver + counts.shoulder;

  const etePercentage =
    totalConsidered > 0 ? (counts.ete / totalConsidered) * 100 : 0;
  const hiverPercentage =
    totalConsidered > 0 ? (counts.hiver / totalConsidered) * 100 : 0;
  const shoulderPercentage =
    totalConsidered > 0 ? (counts.shoulder / totalConsidered) * 100 : 0;

  return {
    eteCount: counts.ete,
    hiverCount: counts.hiver,
    shoulderCount: counts.shoulder,
    etePercentage,
    hiverPercentage,
    shoulderPercentage,
    totalConsidered,
  };
}

function computeAverage(values: number[]): number | null {
  if (!values.length) return null;
  const sum = values.reduce((acc, value) => acc + value, 0);
  return sum / values.length;
}

function getStayLengthInNights(offer: Offer): number | null {
  if (typeof offer.nombreDeNuits === "string") {
    const parsedFromField = extractNumber(offer.nombreDeNuits);
    if (parsedFromField !== null) {
      return parsedFromField;
    }
  }

  const start = parseDate(offer.sejourDu);
  const end = parseDate(offer.sejourAu);
  if (!start || !end) return null;

  const diffMs = end.getTime() - start.getTime();
  if (!Number.isFinite(diffMs) || diffMs <= 0) return null;

  return diffMs / MS_IN_DAY;
}

function extractNumber(value?: string | null) {
  if (!value) return null;
  const match = value.replace(",", ".").match(/-?\d+(\.\d+)?/);
  if (!match) return null;
  const parsed = Number.parseFloat(match[0]);
  return Number.isFinite(parsed) ? parsed : null;
}

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

function getSeason(offer: Offer): "ete" | "hiver" | "shoulder" | null {
  const referenceDate = parseDate(offer.dateEnvoiOffre);
  if (!referenceDate) return null;

  const month = referenceDate.getUTCMonth();
  if (SUMMER_SEND_MONTHS.has(month)) return "ete";
  if (WINTER_SEND_MONTHS.has(month)) return "hiver";
  return "shoulder";
}
