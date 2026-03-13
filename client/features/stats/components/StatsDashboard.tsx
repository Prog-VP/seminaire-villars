"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import type { Offer } from "@/features/offres/types";
import {
  buildOfferStats,
  filterOffersByYear,
  getAvailableYears,
} from "../utils";
import { FieldExplorerSection } from "./FieldExplorerSection";
import { StatsHeader } from "./StatsHeader";
import { OverviewTab } from "./OverviewTab";
import { PeriodesTab } from "./PeriodesTab";

type StatsDashboardProps = {
  offers: Offer[];
};

const TABS = [
  { key: "overview", label: "Vue d'ensemble" },
  { key: "exploration", label: "Exploration" },
  { key: "periodes", label: "Périodes" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export function StatsDashboard({ offers }: StatsDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  const availableYears = getAvailableYears(offers);
  const filteredOffers = filterOffersByYear(offers, selectedYear);
  const stats = buildOfferStats(filteredOffers);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setExportOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const evolution = useMemo(() => {
    if (selectedYear === null) return null;
    const prevOffers = filterOffersByYear(offers, selectedYear - 1);
    if (!prevOffers.length) return null;
    const prevStats = buildOfferStats(prevOffers);
    return { prev: prevStats, prevYear: selectedYear - 1 };
  }, [offers, selectedYear]);

  if (stats.totalOffers === 0 && selectedYear === null) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white px-8 py-12 text-center">
        <p className="text-xl font-semibold text-slate-900">
          Aucune offre disponible
        </p>
        <p className="mt-2 text-sm text-slate-500">
          Créez une première offre pour afficher les statistiques.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ─── Header ─── */}
      <StatsHeader
        stats={stats}
        filteredOffers={filteredOffers}
        selectedYear={selectedYear}
        availableYears={availableYears}
        onYearChange={setSelectedYear}
        exportOpen={exportOpen}
        setExportOpen={setExportOpen}
        exportRef={exportRef}
      />

      {/* ─── Tabs ─── */}
      <nav className="flex gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition ${
              activeTab === tab.key
                ? "bg-brand-900 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* ─── Tab content ─── */}
      {activeTab === "overview" && (
        <OverviewTab
          stats={stats}
          evolution={evolution}
          selectedYear={selectedYear}
        />
      )}

      {activeTab === "periodes" && <PeriodesTab stats={stats} />}

      {activeTab === "exploration" && (
        <FieldExplorerSection offers={offers} selectedYear={selectedYear} />
      )}
    </div>
  );
}
