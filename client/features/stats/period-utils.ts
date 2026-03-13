import type { Offer } from "@/features/offres/types";
import { getEffectiveDates } from "@/features/offres/utils";
import type { MonthlyDistributionItem, SeasonSplit } from "./stats-types";

const MONTH_FORMATTER = new Intl.DateTimeFormat("fr-FR", { month: "long" });
const SUMMER_SEND_MONTHS = new Set([4, 5, 6, 7, 8, 9, 10]); // May → Nov
const WINTER_SEND_MONTHS = new Set([11, 0, 1, 2, 3]); // Dec → Apr

function capitalizeFirst(value: string) {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
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

function getSeason(offer: Offer): "ete" | "hiver" | "shoulder" | null {
  const referenceDate = parseDate(offer.createdAt);
  if (!referenceDate) return null;

  const month = referenceDate.getUTCMonth();
  if (SUMMER_SEND_MONTHS.has(month)) return "ete";
  if (WINTER_SEND_MONTHS.has(month)) return "hiver";
  return "shoulder";
}

export function buildStayMonthDistribution(offers: Offer[]): MonthlyDistributionItem[] {
  const monthlyCounts = new Map<number, number>();
  let total = 0;

  for (const offer of offers) {
    const eff = getEffectiveDates(offer);
    const dateStr = eff.du;
    if (!dateStr) continue;
    const date = parseDate(dateStr);
    if (!date) continue;
    total += 1;
    const monthIndex = date.getUTCMonth();
    monthlyCounts.set(monthIndex, (monthlyCounts.get(monthIndex) ?? 0) + 1);
  }

  return Array.from(monthlyCounts.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([monthIndex, count]) => ({
      monthIndex,
      label: capitalizeFirst(
        MONTH_FORMATTER.format(new Date(Date.UTC(2024, monthIndex, 1))),
      ),
      count,
      percentage: total > 0 ? (count / total) * 100 : 0,
    }));
}

export function buildMonthlyDistribution(offers: Offer[]) {
  const monthlyCounts = new Map<number, number>();
  let offersWithSendDate = 0;

  offers.forEach((offer) => {
    const date = parseDate(offer.createdAt);
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

export function buildSeasonSplit(offers: Offer[]): SeasonSplit {
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
