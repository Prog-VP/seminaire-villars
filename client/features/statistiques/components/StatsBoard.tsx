"use client";

import { useCallback, useState } from "react";
import type { Offer } from "@/features/offres/types";
import { useStatsFilters } from "../hooks/useStatsFilters";
import { useChartVisibility } from "../hooks/useChartVisibility";
import { useStatsDerivedData } from "../hooks/useStatsDerivedData";
import { ActiveFilters } from "./ActiveFilters";
import { FilteredOffersTable } from "./FilteredOffersTable";
import { GeneralStatsTab } from "./GeneralStatsTab";
import { HotelStatsTab } from "./HotelStatsTab";

type StatsBoardProps = {
  offers: Offer[];
  errorMessage?: string | null;
};

const emptyYearSet = new Set<number>();

export function StatsBoard({ offers, errorMessage }: StatsBoardProps) {
  const {
    filters,
    yearPin,
    monthFilters,
    yearFilters,
    hotelFilter,
    activeTab,
    searchParams,
    pushParams,
    toggleFilter,
    toggleCellFilter,
    toggleMonthFilter,
    clearFilter,
    clearMonthFilter,
    clearAllFilters,
  } = useStatsFilters();

  /* ── Local year visibility per chart (legend toggle = show/hide bars + filter data) ── */
  const [chartYearFilters, setChartYearFilters] = useState<Record<string, Set<number>>>({});
  const toggleChartYearFilter = useCallback((chartKey: string, year: number) => {
    setChartYearFilters((prev) => {
      const current = prev[chartKey] ?? new Set<number>();
      const next = new Set(current);
      if (next.has(year)) next.delete(year);
      else next.add(year);
      return { ...prev, [chartKey]: next };
    });
  }, []);
  const getChartYearFilters = useCallback((chartKey: string): Set<number> => {
    return chartYearFilters[chartKey] ?? emptyYearSet;
  }, [chartYearFilters]);
  const clearChartYearFilters = useCallback((chartKey: string) => {
    setChartYearFilters((prev) => ({ ...prev, [chartKey]: new Set<number>() }));
  }, []);

  const hasFilters =
    Object.keys(filters).length > 0 ||
    yearPin !== null ||
    monthFilters.envoi != null ||
    monthFilters.sejour != null ||
    yearFilters.size > 0 ||
    (chartYearFilters["mEnvoi"]?.size ?? 0) > 0 ||
    (chartYearFilters["mSejour"]?.size ?? 0) > 0 ||
    !!hotelFilter;
  const {
    allYears,
    fullyFiltered,
    dimData,
    envoiMonthlyData,
    sejourMonthlyData,
    envoiYearTotals,
  } = useStatsDerivedData({
    offers,
    filters,
    yearPin,
    monthFilters,
    chartYearFilters,
    hotelFilter,
  });

  const { hiddenCharts, toggleChartVisibility } = useChartVisibility(searchParams, pushParams);

  /* ── Table visibility per dimension ── */
  const [visibleTables, setVisibleTables] = useState<Set<string>>(new Set());
  const toggleTable = useCallback((key: string) => {
    setVisibleTables((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  /* ── Render ── */

  if (errorMessage) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {errorMessage}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header + sub-tabs */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold text-slate-900">Statistiques</h1>
            <p className="text-xs text-slate-400">
              Cliquez sur un graphique ou une ligne pour filtrer toutes les dimensions
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 border-b border-slate-200">
          <button
            type="button"
            onClick={() => pushParams((params) => {
              params.delete("tab");
            })}
            className={`relative px-1 pb-2.5 pt-1 text-sm font-semibold transition ${
              activeTab === "general" ? "text-brand-900" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Général
            {activeTab === "general" && (
              <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-brand-900" />
            )}
          </button>
          <button
            type="button"
            onClick={() => pushParams((params) => {
              params.set("tab", "hotels");
            })}
            className={`relative px-1 pb-2.5 pt-1 text-sm font-semibold transition ${
              activeTab === "hotels" ? "text-brand-900" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Hôtels
            {activeTab === "hotels" && (
              <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-brand-900" />
            )}
          </button>
        </div>
      </div>

      {/* Active filters */}
      <ActiveFilters
        filters={filters}
        yearPin={yearPin}
        monthFilters={monthFilters}
        yearFilters={emptyYearSet}
        envoiYearFilters={getChartYearFilters("mEnvoi")}
        sejourYearFilters={getChartYearFilters("mSejour")}
        allYears={allYears}
        hotelFilter={hotelFilter}
        onClear={clearFilter}
        onClearMonth={clearMonthFilter}
        onToggleYear={() => {}}
        onToggleEnvoiYear={(y) => toggleChartYearFilter("mEnvoi", y)}
        onToggleSejourYear={(y) => toggleChartYearFilter("mSejour", y)}
        onClearHotel={() => pushParams((params) => {
          params.delete("hotel");
        })}
        onClearAll={() => {
          clearAllFilters();
          setChartYearFilters({});
        }}
      />

      {activeTab === "general" && (
        <GeneralStatsTab
          hiddenCharts={hiddenCharts}
          filters={filters}
          yearPin={yearPin}
          monthFilters={monthFilters}
          allYears={allYears}
          envoiYearTotals={envoiYearTotals}
          envoiMonthlyData={envoiMonthlyData}
          sejourMonthlyData={sejourMonthlyData}
          dimData={dimData}
          visibleTables={visibleTables}
          onToggleChartVisibility={toggleChartVisibility}
          getChartYearFilters={getChartYearFilters}
          onToggleChartYear={toggleChartYearFilter}
          onClearChartYearFilters={clearChartYearFilters}
          onToggleMonth={toggleMonthFilter}
          onClearMonth={clearMonthFilter}
          onToggleFilter={toggleFilter}
          onClearFilter={clearFilter}
          onToggleCellFilter={toggleCellFilter}
          onToggleTable={toggleTable}
        />
      )}

      {/* === Hôtels tab === */}
      {activeTab === "hotels" && (
        <HotelStatsTab
          offers={fullyFiltered}
          allYears={allYears}
          yearFilters={yearFilters}
          activeHotel={searchParams.get("hotel") || undefined}
          onToggleHotel={(name) => pushParams((params) => {
            if (params.get("hotel") === name) {
              params.delete("hotel");
            } else {
              params.set("hotel", name);
            }
          })}
        />
      )}

      {/* Filtered offers table */}
      <FilteredOffersTable
        offers={fullyFiltered}
        hasFilters={hasFilters}
        filters={filters}
        yearFilters={yearFilters}
        monthFilters={monthFilters}
        filteredOfferIds={fullyFiltered.map((o) => o.id)}
      />
    </div>
  );
}
