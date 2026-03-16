"use client";

import { useCallback, useMemo } from "react";
import type { Offer } from "@/features/offres/types";
import type { Dimension, EvoDimData } from "../types";
import { DIM_LABELS, DIM_CONFIG } from "../types";
import { getYear, dimValue, buildEvolutionData, buildMonthlyData, getSejourMonth } from "../data";
import { useStatsFilters } from "../hooks/useStatsFilters";
import { Section } from "./Section";
import { ActiveFilters } from "./ActiveFilters";
import { GroupedBarChart } from "./GroupedBarChart";
import { EvolutionTable } from "./EvolutionTable";
import { MonthlyGroupedChart } from "./MonthlyGroupedChart";
import { FilteredOffersTable } from "./FilteredOffersTable";
import { HotelStatsTab } from "./HotelStatsTab";

type StatsBoardProps = {
  offers: Offer[];
  errorMessage?: string | null;
};

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
    toggleYearFilter,
    clearAllFilters,
  } = useStatsFilters();

  /* ── Derived state that depends on offers ── */

  // All years across the dataset (stable order for color mapping)
  const allYears = useMemo(() => {
    const set = new Set<number>();
    for (const o of offers) {
      const y = getYear(o.dateEnvoiOffre);
      if (y) set.add(y);
    }
    return Array.from(set).sort((a, b) => a - b);
  }, [offers]);

  const hasFilters = Object.keys(filters).length > 0 || yearPin !== null || monthFilters.envoi != null || monthFilters.sejour != null || yearFilters.size > 0 || !!hotelFilter;

  // Cross-filter: for each dim, exclude own filter
  const applyFilters = useCallback(
    (data: Offer[], excludeDim?: Dimension) => {
      let result = data;
      for (const [dim, val] of Object.entries(filters) as [Dimension, string][]) {
        if (dim === excludeDim) continue;
        result = result.filter((o) => dimValue(o, dim) === val);
      }
      // Apply year filters
      if (yearFilters.size > 0) {
        result = result.filter((o) => {
          const y = getYear(o.dateEnvoiOffre);
          return y !== null && yearFilters.has(y);
        });
      }
      // Apply month filters
      if (monthFilters.envoi != null) {
        result = result.filter((o) => {
          if (!o.dateEnvoiOffre) return false;
          return new Date(o.dateEnvoiOffre).getMonth() === monthFilters.envoi;
        });
      }
      if (monthFilters.sejour != null) {
        result = result.filter((o) => {
          const sm = getSejourMonth(o);
          return sm === monthFilters.sejour;
        });
      }
      // Apply hotel filter
      const hf = searchParams.get("hotel");
      if (hf) {
        result = result.filter((o) =>
          o.hotelSendsNames?.includes(hf) || o.hotelResponses?.some((r) => r.hotelName === hf),
        );
      }
      return result;
    },
    [filters, monthFilters, yearFilters, searchParams],
  );

  // Fully filtered + year pin applied
  const fullyFiltered = useMemo(() => {
    let result = applyFilters(offers);
    if (yearPin) {
      result = result.filter((o) => getYear(o.dateEnvoiOffre) === yearPin.year);
    }
    return result;
  }, [offers, applyFilters, yearPin]);

  // Build evolution data per dimension (excluding own filter for cross-filtering)
  const dimData = useMemo(() => {
    const result: Record<Dimension, EvoDimData> = {} as Record<Dimension, EvoDimData>;
    for (const { dim } of DIM_CONFIG) {
      const subset = applyFilters(offers, dim);
      result[dim] = buildEvolutionData(subset, dim);
    }
    return result;
  }, [offers, applyFilters]);

  // Monthly data for envoi and séjour
  const envoiMonthlyData = useMemo(
    () => buildMonthlyData(applyFilters(offers), (o) => {
      if (!o.dateEnvoiOffre) return null;
      const d = new Date(o.dateEnvoiOffre);
      return Number.isNaN(d.getTime()) ? null : d;
    }),
    [offers, applyFilters],
  );

  const sejourMonthlyData = useMemo(
    () => buildMonthlyData(applyFilters(offers), (o) => {
      if (o.dateConfirmeeDu) {
        const d = new Date(o.dateConfirmeeDu);
        if (!Number.isNaN(d.getTime())) return d;
      }
      if (o.dateOptions && o.dateOptions.length > 0 && o.dateOptions[0].du) {
        const d = new Date(o.dateOptions[0].du);
        if (!Number.isNaN(d.getTime())) return d;
      }
      return null;
    }),
    [offers, applyFilters],
  );

  /* ── Graph visibility (URL param "hide") ── */

  const hiddenDims = useMemo(() => {
    const v = searchParams.get("hide");
    if (!v) return new Set<Dimension>();
    return new Set(v.split(",").filter(Boolean) as Dimension[]);
  }, [searchParams]);

  const toggleDimVisibility = useCallback((dim: Dimension) => {
    pushParams((p) => {
      const current = p.get("hide");
      const set = new Set((current ?? "").split(",").filter(Boolean));
      if (set.has(dim)) {
        set.delete(dim);
      } else {
        set.add(dim);
      }
      if (set.size > 0) {
        p.set("hide", Array.from(set).join(","));
      } else {
        p.delete("hide");
      }
    });
  }, [pushParams]);

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
            onClick={() => pushParams((p) => { p.delete("tab"); })}
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
            onClick={() => pushParams((p) => { p.set("tab", "hotels"); })}
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
        yearFilters={yearFilters}
        allYears={allYears}
        hotelFilter={hotelFilter}
        onClear={clearFilter}
        onClearMonth={clearMonthFilter}
        onToggleYear={toggleYearFilter}
        onClearHotel={() => pushParams((p) => p.delete("hotel"))}
        onClearAll={clearAllFilters}
      />

      {/* === Général tab === */}
      {activeTab === "general" && <>

      {/* Graph visibility selector */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-xs font-medium text-slate-400 mr-1">Afficher :</span>
        {["mEnvoi", "mSejour"].map((key) => {
          const label = key === "mEnvoi" ? "Mois envoi" : "Mois séjour";
          const isOn = !hiddenDims.has(key as Dimension);
          return (
            <button
              key={key}
              type="button"
              onClick={() => toggleDimVisibility(key as Dimension)}
              className={`rounded-full border px-2.5 py-1 text-xs font-medium transition ${
                isOn
                  ? "border-brand-300 bg-brand-50 text-brand-700"
                  : "border-slate-200 bg-white text-slate-400"
              }`}
            >
              {label}
            </button>
          );
        })}
        {DIM_CONFIG.map(({ dim }) => {
          const isOn = !hiddenDims.has(dim);
          return (
            <button
              key={dim}
              type="button"
              onClick={() => toggleDimVisibility(dim)}
              className={`rounded-full border px-2.5 py-1 text-xs font-medium transition ${
                isOn
                  ? "border-brand-300 bg-brand-50 text-brand-700"
                  : "border-slate-200 bg-white text-slate-400"
              }`}
            >
              {DIM_LABELS[dim]}
            </button>
          );
        })}
      </div>

      {/* Monthly evolution (stacked) */}
      <div className="grid gap-5">
        {!hiddenDims.has("mEnvoi" as Dimension) && (
          <Section
            title="Évolution mensuelle — Dates d'envoi"
            filterActive={monthFilters.envoi != null}
            onClear={() => clearMonthFilter("envoi")}
          >
            <MonthlyGroupedChart
              data={envoiMonthlyData}
              activeMonth={monthFilters.envoi}
              activeYears={yearFilters}
              allYears={allYears}
              onClickMonth={(m) => toggleMonthFilter("envoi", m)}
              onClickYear={toggleYearFilter}
            />
          </Section>
        )}
        {!hiddenDims.has("mSejour" as Dimension) && (
          <Section
            title="Évolution mensuelle — Dates de séjour"
            filterActive={monthFilters.sejour != null}
            onClear={() => clearMonthFilter("sejour")}
          >
            <MonthlyGroupedChart
              data={sejourMonthlyData}
              activeMonth={monthFilters.sejour}
              activeYears={yearFilters}
              allYears={allYears}
              onClickMonth={(m) => toggleMonthFilter("sejour", m)}
              onClickYear={toggleYearFilter}
            />
          </Section>
        )}
      </div>

      {/* Dimension charts + tables */}
      <div className="space-y-5">
        {DIM_CONFIG.map(({ dim, limit }) => {
          if (hiddenDims.has(dim)) return null;
          return (
            <Section
              key={dim}
              title={DIM_LABELS[dim]}
              filterActive={dim in filters}
              onClear={() => clearFilter(dim)}
            >
              <div className="space-y-4">
                <GroupedBarChart
                  data={dimData[dim]}
                  limit={limit ? Math.min(limit, 10) : 10}
                  dim={dim}
                  activeValue={filters[dim]}
                  activeYears={yearFilters}
                  allYears={allYears}
                  onClickBar={(val) => toggleFilter(dim, val)}
                  onClickYear={toggleYearFilter}
                />
                <div className="border-t border-slate-100 pt-3">
                  <EvolutionTable
                    data={dimData[dim]}
                    dim={dim}
                    limit={limit}
                    activeValue={filters[dim]}
                    activeYear={yearPin?.dim === dim ? yearPin.year : undefined}
                    activeYears={yearFilters}
                    allYears={allYears}
                    onClickRow={(val) => toggleFilter(dim, val)}
                    onClickCell={(val, year) => toggleCellFilter(dim, val, year)}
                  />
                </div>
              </div>
            </Section>
          );
        })}
      </div>

      </>}

      {/* === Hôtels tab === */}
      {activeTab === "hotels" && (
        <HotelStatsTab
          offers={fullyFiltered}
          allYears={allYears}
          yearFilters={yearFilters}
          activeHotel={searchParams.get("hotel") || undefined}
          onToggleHotel={(name) => pushParams((p) => {
            if (p.get("hotel") === name) {
              p.delete("hotel");
            } else {
              p.set("hotel", name);
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
      />
    </div>
  );
}
