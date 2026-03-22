"use client";

import { useCallback, useMemo, useState } from "react";
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
    toggleYearFilter,
    clearAllFilters,
  } = useStatsFilters();

  /* ── Derived state that depends on offers ── */

  // All years across the dataset (envoi + séjour, for stable color mapping)
  const allYears = useMemo(() => {
    const set = new Set<number>();
    for (const o of offers) {
      const yEnvoi = getYear(o.dateEnvoiOffre);
      if (yEnvoi) set.add(yEnvoi);
      const ySejour = getYear(o.dateConfirmeeDu) ?? (o.dateOptions?.[0]?.du ? getYear(o.dateOptions[0].du) : null);
      if (ySejour) set.add(ySejour);
    }
    return Array.from(set).sort((a, b) => a - b);
  }, [offers]);

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
    return chartYearFilters[chartKey] ?? new Set<number>();
  }, [chartYearFilters]);

  const hasFilters = Object.keys(filters).length > 0 || yearPin !== null || monthFilters.envoi != null || monthFilters.sejour != null || yearFilters.size > 0 || (chartYearFilters["mEnvoi"]?.size ?? 0) > 0 || (chartYearFilters["mSejour"]?.size ?? 0) > 0 || !!hotelFilter;

  // Helper: get séjour year from an offer
  const getSejourYear = useCallback((o: Offer): number | null => {
    const dc = o.dateConfirmeeDu;
    if (dc) { const y = getYear(dc); if (y) return y; }
    const d1 = o.dateOptions?.[0]?.du;
    if (d1) { const y = getYear(d1); if (y) return y; }
    return null;
  }, []);

  // Cross-filter: for each dim, exclude own filter
  const applyFilters = useCallback(
    (data: Offer[], excludeDim?: Dimension) => {
      let result = data;
      for (const [dim, val] of Object.entries(filters) as [Dimension, string][]) {
        if (dim === excludeDim) continue;
        result = result.filter((o) => dimValue(o, dim) === val);
      }
      // Apply envoi year filters (from monthly envoi chart legend)
      const envoiYF = chartYearFilters["mEnvoi"];
      if (envoiYF && envoiYF.size > 0) {
        result = result.filter((o) => {
          const y = getYear(o.dateEnvoiOffre);
          return y !== null && envoiYF.has(y);
        });
      }
      // Apply séjour year filters (from monthly séjour chart legend)
      const sejourYF = chartYearFilters["mSejour"];
      if (sejourYF && sejourYF.size > 0) {
        result = result.filter((o) => {
          const y = getSejourYear(o);
          return y !== null && sejourYF.has(y);
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
    [filters, monthFilters, chartYearFilters, searchParams, getSejourYear],
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
        onClearHotel={() => pushParams((p) => p.delete("hotel"))}
        onClearAll={() => {
          clearAllFilters();
          setChartYearFilters({});
        }}
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
              activeYears={getChartYearFilters("mEnvoi")}
              allYears={allYears}
              onClickMonth={(m) => toggleMonthFilter("envoi", m)}
              onClickYear={(y) => toggleChartYearFilter("mEnvoi", y)}
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
              activeYears={getChartYearFilters("mSejour")}
              allYears={allYears}
              onClickMonth={(m) => toggleMonthFilter("sejour", m)}
              onClickYear={(y) => toggleChartYearFilter("mSejour", y)}
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
                  activeYears={emptyYearSet}
                  allYears={allYears}
                  onClickBar={(val) => toggleFilter(dim, val)}
                  hideLegend
                />
                <div className="border-t border-slate-100 pt-2">
                  <button
                    type="button"
                    onClick={() => toggleTable(dim)}
                    className="flex items-center gap-1.5 text-xs font-medium text-slate-400 transition hover:text-slate-600"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className={`h-3.5 w-3.5 transition-transform ${visibleTables.has(dim) ? "rotate-90" : ""}`}
                    >
                      <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 0 1 .02-1.06L11.168 10 7.23 6.29a.75.75 0 1 1 1.04-1.08l4.5 4.25a.75.75 0 0 1 0 1.08l-4.5 4.25a.75.75 0 0 1-1.06-.02Z" clipRule="evenodd" />
                    </svg>
                    {visibleTables.has(dim) ? "Masquer le tableau" : "Afficher le tableau"}
                  </button>
                  {visibleTables.has(dim) && (
                    <div className="mt-3">
                      <EvolutionTable
                        data={dimData[dim]}
                        dim={dim}
                        limit={limit}
                        activeValue={filters[dim]}
                        activeYear={yearPin?.dim === dim ? yearPin.year : undefined}
                        activeYears={emptyYearSet}
                        allYears={allYears}
                        onClickRow={(val) => toggleFilter(dim, val)}
                        onClickCell={(val, year) => toggleCellFilter(dim, val, year)}
                      />
                    </div>
                  )}
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
        filteredOfferIds={fullyFiltered.map((o) => o.id)}
      />
    </div>
  );
}
