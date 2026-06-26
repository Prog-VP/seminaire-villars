import { useCallback, useMemo } from "react";
import type { Offer } from "@/features/offres/types";
import type { Dimension, EvoDimData, Filters, MonthFilters, YearPin } from "../types";
import { DIM_CONFIG } from "../types";
import { buildEvolutionData, buildMonthlyData, dimValue, getSejourMonth, getYear } from "../data";

type UseStatsDerivedDataInput = {
  offers: Offer[];
  filters: Filters;
  yearPin: YearPin;
  monthFilters: MonthFilters;
  chartYearFilters: Record<string, Set<number>>;
  hotelFilter?: string;
};

function getSejourYear(offer: Offer): number | null {
  const confirmedDate = offer.dateConfirmeeDu;
  if (confirmedDate) {
    const year = getYear(confirmedDate);
    if (year) return year;
  }

  const firstOptionDate = offer.dateOptions?.[0]?.du;
  if (firstOptionDate) {
    const year = getYear(firstOptionDate);
    if (year) return year;
  }

  return null;
}

export function useStatsDerivedData({
  offers,
  filters,
  yearPin,
  monthFilters,
  chartYearFilters,
  hotelFilter,
}: UseStatsDerivedDataInput) {
  const allYears = useMemo(() => {
    const years = new Set<number>();
    for (const offer of offers) {
      const envoiYear = getYear(offer.dateEnvoiOffre);
      if (envoiYear) years.add(envoiYear);

      const sejourYear = getSejourYear(offer);
      if (sejourYear) years.add(sejourYear);
    }
    return Array.from(years).sort((a, b) => a - b);
  }, [offers]);

  const applyFilters = useCallback(
    (data: Offer[], excludeDim?: Dimension) => {
      let result = data;

      for (const [dim, value] of Object.entries(filters) as [Dimension, string][]) {
        if (dim === excludeDim) continue;
        result = result.filter((offer) => dimValue(offer, dim) === value);
      }

      const envoiYearFilters = chartYearFilters["mEnvoi"];
      if (envoiYearFilters && envoiYearFilters.size > 0) {
        result = result.filter((offer) => {
          const year = getYear(offer.dateEnvoiOffre);
          return year !== null && envoiYearFilters.has(year);
        });
      }

      const sejourYearFilters = chartYearFilters["mSejour"];
      if (sejourYearFilters && sejourYearFilters.size > 0) {
        result = result.filter((offer) => {
          const year = getSejourYear(offer);
          return year !== null && sejourYearFilters.has(year);
        });
      }

      if (monthFilters.envoi != null) {
        result = result.filter((offer) => {
          if (!offer.dateEnvoiOffre) return false;
          return new Date(offer.dateEnvoiOffre).getMonth() === monthFilters.envoi;
        });
      }

      if (monthFilters.sejour != null) {
        result = result.filter((offer) => getSejourMonth(offer) === monthFilters.sejour);
      }

      if (hotelFilter) {
        result = result.filter((offer) =>
          offer.hotelSendsNames?.includes(hotelFilter) ||
          offer.hotelResponses?.some((response) => response.hotelName === hotelFilter),
        );
      }

      return result;
    },
    [filters, monthFilters, chartYearFilters, hotelFilter],
  );

  const fullyFiltered = useMemo(() => {
    let result = applyFilters(offers);
    if (yearPin) {
      result = result.filter((offer) => getYear(offer.dateEnvoiOffre) === yearPin.year);
    }
    return result;
  }, [offers, applyFilters, yearPin]);

  const dimData = useMemo(() => {
    const result: Record<Dimension, EvoDimData> = {} as Record<Dimension, EvoDimData>;
    for (const { dim } of DIM_CONFIG) {
      result[dim] = buildEvolutionData(applyFilters(offers, dim), dim);
    }
    return result;
  }, [offers, applyFilters]);

  const envoiMonthlyData = useMemo(
    () => buildMonthlyData(applyFilters(offers), (offer) => {
      if (!offer.dateEnvoiOffre) return null;
      const date = new Date(offer.dateEnvoiOffre);
      return Number.isNaN(date.getTime()) ? null : date;
    }),
    [offers, applyFilters],
  );

  const sejourMonthlyData = useMemo(
    () => buildMonthlyData(applyFilters(offers), (offer) => {
      if (offer.dateConfirmeeDu) {
        const date = new Date(offer.dateConfirmeeDu);
        if (!Number.isNaN(date.getTime())) return date;
      }

      const firstOptionDate = offer.dateOptions?.[0]?.du;
      if (firstOptionDate) {
        const date = new Date(firstOptionDate);
        if (!Number.isNaN(date.getTime())) return date;
      }

      return null;
    }),
    [offers, applyFilters],
  );

  const envoiYearTotals = useMemo(() => {
    const totals: Record<number, number> = {};
    for (const offer of applyFilters(offers)) {
      const year = getYear(offer.dateEnvoiOffre);
      if (!year) continue;
      totals[year] = (totals[year] ?? 0) + 1;
    }
    return totals;
  }, [offers, applyFilters]);

  return {
    allYears,
    fullyFiltered,
    dimData,
    envoiMonthlyData,
    sejourMonthlyData,
    envoiYearTotals,
  };
}
