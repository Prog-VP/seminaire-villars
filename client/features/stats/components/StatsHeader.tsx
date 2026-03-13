"use client";

import type { RefObject } from "react";
import type { Offer } from "@/features/offres/types";
import type { buildOfferStats } from "../utils";
import { exportStatsCSV, exportStatsXLSX } from "../export";
import { HeaderPill } from "./StatCards";

type Stats = ReturnType<typeof buildOfferStats>;

type StatsHeaderProps = {
  stats: Stats;
  filteredOffers: Offer[];
  selectedYear: number | null;
  availableYears: number[];
  onYearChange: (year: number | null) => void;
  exportOpen: boolean;
  setExportOpen: (open: boolean) => void;
  exportRef: RefObject<HTMLDivElement | null>;
};

export function StatsHeader({
  stats,
  filteredOffers,
  selectedYear,
  availableYears,
  onYearChange,
  exportOpen,
  setExportOpen,
  exportRef,
}: StatsHeaderProps) {
  return (
    <header className="rounded-xl border border-slate-200 bg-gradient-to-r from-brand-900 to-brand-500 p-6 text-white shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="text-[0.65rem] font-semibold uppercase tracking-widest text-white/60">
            Analyse
          </p>
          <h2 className="text-2xl font-semibold">Statistiques des offres</h2>
          <p className="text-sm text-slate-300">
            Basé sur {stats.totalOffers} offre
            {stats.totalOffers > 1 ? "s" : ""} enregistrée
            {stats.totalOffers > 1 ? "s" : ""}.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedYear ?? ""}
            onChange={(e) =>
              onYearChange(
                e.target.value === "" ? null : Number(e.target.value),
              )
            }
            className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-white/30"
          >
            <option value="" className="text-slate-900">
              Toutes les années
            </option>
            {availableYears.map((y) => (
              <option key={y} value={y} className="text-slate-900">
                {y}
              </option>
            ))}
          </select>

          <div className="relative" ref={exportRef}>
            <button
              type="button"
              onClick={() => setExportOpen(!exportOpen)}
              className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white backdrop-blur-sm hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/30"
            >
              Exporter
            </button>
            {exportOpen && (
              <div className="absolute right-0 z-10 mt-1 w-36 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                <button
                  type="button"
                  className="block w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                  onClick={() => {
                    exportStatsCSV(filteredOffers, stats, selectedYear);
                    setExportOpen(false);
                  }}
                >
                  CSV
                </button>
                <button
                  type="button"
                  className="block w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                  onClick={() => {
                    exportStatsXLSX(filteredOffers, stats, selectedYear);
                    setExportOpen(false);
                  }}
                >
                  Excel (.xlsx)
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <HeaderPill label="Offres suivies" value={`${stats.totalOffers}`} />
        <HeaderPill
          label="Avec date d'envoi"
          value={`${stats.offersWithSendDate}`}
        />
        <HeaderPill
          label="Réponses hôtels"
          value={`${stats.totalHotelResponses}`}
        />
      </div>
    </header>
  );
}
