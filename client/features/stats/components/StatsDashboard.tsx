"use client";

import { useState, useRef, useEffect } from "react";
import type { Offer } from "@/features/offres/types";
import {
  buildOfferStats,
  filterOffersByYear,
  getAvailableYears,
} from "../utils";
import { exportStatsCSV, exportStatsXLSX } from "../export";
import { PieChartCard } from "./PieChartCard";

type StatsDashboardProps = {
  offers: Offer[];
};

const numberFormatter = new Intl.NumberFormat("fr-FR", {
  maximumFractionDigits: 1,
});

export function StatsDashboard({ offers }: StatsDashboardProps) {
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  const availableYears = getAvailableYears(offers);
  const filteredOffers = filterOffersByYear(offers, selectedYear);
  const stats = buildOfferStats(filteredOffers);

  // Close export dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setExportOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Evolution N vs N-1
  const evolution = (() => {
    if (selectedYear === null) return null;
    const prevOffers = filterOffersByYear(offers, selectedYear - 1);
    if (!prevOffers.length) return null;
    const prevStats = buildOfferStats(prevOffers);
    return { prev: prevStats, prevYear: selectedYear - 1 };
  })();

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
    <div className="space-y-10">
      {/* ─── Header ─── */}
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
            {/* Year filter */}
            <select
              value={selectedYear ?? ""}
              onChange={(e) =>
                setSelectedYear(
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

            {/* Export dropdown */}
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

      {/* ─── Provenance ─── */}
      <section>
        <PieChartCard
          title="Provenance des demandes"
          description="Répartition des offres selon le pays indiqué."
          data={stats.provenance}
        />
      </section>

      {/* ─── Transmis par ─── */}
      <section>
        <PieChartCard
          title="Transmis par"
          description="Répartition selon la source de transmission."
          data={stats.transmitters}
          colors={[
            "#8b5cf6",
            "#f59e0b",
            "#10b981",
            "#ef4444",
            "#06b6d4",
            "#1e3a5f",
            "#f97316",
            "#ec4899",
          ]}
        />
      </section>

      {/* ─── Type de séjour ─── */}
      <section>
        <PieChartCard
          title="Type de séjour"
          description="Répartition par type (Groupe, Incentive, Séminaire, etc.)."
          data={stats.typeBreakdown}
          colors={[
            "#06b6d4",
            "#f97316",
            "#10b981",
            "#ef4444",
            "#8b5cf6",
            "#1e3a5f",
            "#f59e0b",
            "#ec4899",
          ]}
        />
      </section>

      {/* ─── Offres confirmées : hébergement vs activité ─── */}
      <section>
        <SectionHeader
          title="Offres confirmées"
          description="Répartition des offres confirmées entre hébergement et activité uniquement."
        />
        <div className="grid gap-4 md:grid-cols-2">
          <HighlightCard
            label="Hébergement"
            value={`${stats.confirmedSplit.hebergement}`}
            helperText="Offres confirmées incluant de l'hébergement."
          />
          <HighlightCard
            label="Activité uniquement"
            value={`${stats.confirmedSplit.activite}`}
            helperText="Offres confirmées sans hébergement."
          />
        </div>
      </section>

      {/* ─── Indicateurs clés ─── */}
      <section>
        <SectionHeader
          title="Indicateurs clés"
          description="Durée moyenne des séjours et taille moyenne des groupes."
        />
        <div className="grid gap-4 md:grid-cols-2">
          <HighlightCard
            label="Durée moyenne des séjours"
            value={
              stats.averageStayLength
                ? `${formatNumber(stats.averageStayLength)} nuit${
                    stats.averageStayLength > 1 ? "s" : ""
                  }`
                : "\u2014"
            }
            helperText={
              stats.averageStayLength
                ? "Calculé à partir des nuits renseignées ou des dates de séjour."
                : "Pas assez de données pour l'instant."
            }
          />
          <HighlightCard
            label="Taille moyenne des groupes"
            value={
              stats.averageGroupSize
                ? `${formatNumber(stats.averageGroupSize)} participant${
                    stats.averageGroupSize >= 2 ? "s" : ""
                  }`
                : "\u2014"
            }
            helperText={
              stats.averageGroupSize
                ? "Nombre de participants indiqué dans les offres."
                : "Pas assez de données pour l'instant."
            }
          />
        </div>
      </section>

      {/* ─── Dates des séjours (mois effectif) ─── */}
      {stats.stayMonthDistribution.length > 0 && (
        <section>
          <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <SectionHeader
              title="Dates des séjours"
              description="Mois durant lesquels les séjours ont lieu, basé sur la date confirmée ou la première option de dates."
              size="small"
            />
            <div className="mt-4 space-y-3">
              {stats.stayMonthDistribution.map((item) => (
                <div
                  key={item.monthIndex}
                  className="rounded-lg border border-slate-100 bg-slate-50 p-4"
                >
                  <div className="flex items-center justify-between text-sm font-medium text-slate-900">
                    <span className="capitalize">{item.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-white px-2 py-1 text-xs font-semibold text-slate-700 shadow-sm">
                        {formatPercentage(item.percentage)}
                      </span>
                      <span className="text-xs font-medium text-slate-500">
                        {item.count} offre{item.count > 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
                    <div
                      className="h-full rounded-full bg-emerald-500/80"
                      style={{
                        width: `${clampPercentage(item.percentage)}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </article>
        </section>
      )}

      {/* ─── Période d'envoi + Été vs hiver ─── */}
      <section className="grid gap-6 lg:grid-cols-[3fr_2fr]">
        <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <SectionHeader
            title="Période d'envoi des offres"
            description={
              stats.offersWithSendDate
                ? `Répartition mensuelle des ${stats.offersWithSendDate} offre${
                    stats.offersWithSendDate > 1 ? "s" : ""
                  } avec date d'envoi.`
                : "Aucune date d'envoi n'est renseignée."
            }
            size="small"
          />
          {stats.monthlyDistribution.length ? (
            <div className="mt-4 space-y-3">
              {stats.monthlyDistribution.map((item) => (
                <div
                  key={item.monthIndex}
                  className="rounded-lg border border-slate-100 bg-slate-50 p-4"
                >
                  <div className="flex items-center justify-between text-sm font-medium text-slate-900">
                    <span className="capitalize">{item.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-white px-2 py-1 text-xs font-semibold text-slate-700 shadow-sm">
                        {formatPercentage(item.percentage)}
                      </span>
                      <span className="text-xs font-medium text-slate-500">
                        {item.count} offre{item.count > 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
                    <div
                      className="h-full rounded-full bg-brand-900/80"
                      style={{
                        width: `${clampPercentage(item.percentage)}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-6 text-sm text-slate-500">
              Ajoutez des dates d&apos;envoi pour visualiser la répartition
              mensuelle.
            </p>
          )}
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <SectionHeader
            title="Été vs hiver"
            description="Répartition des offres envoyées en été (mai-nov.) ou en hiver (déc.-avr.), basée sur la date d'envoi."
            size="small"
          />
          {stats.seasonSplit.totalConsidered ? (
            <>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <SeasonStat
                  label="Été"
                  percentage={stats.seasonSplit.etePercentage}
                  count={stats.seasonSplit.eteCount}
                />
                <SeasonStat
                  label="Hiver"
                  percentage={stats.seasonSplit.hiverPercentage}
                  count={stats.seasonSplit.hiverCount}
                />
              </div>
              <div className="mt-6 h-3 w-full overflow-hidden rounded-full bg-slate-100">
                <div className="relative flex h-full" aria-hidden="true">
                  <div
                    className="h-full bg-amber-400"
                    style={{
                      width: `${clampPercentage(stats.seasonSplit.etePercentage)}%`,
                    }}
                  />
                  <div
                    className="h-full bg-brand-900"
                    style={{
                      width: `${clampPercentage(stats.seasonSplit.hiverPercentage)}%`,
                    }}
                  />
                  <div
                    className="h-full bg-slate-300"
                    style={{
                      width: `${clampPercentage(stats.seasonSplit.shoulderPercentage)}%`,
                    }}
                  />
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-600">
                <LegendDot colorClass="bg-amber-400" label="Été" />
                <LegendDot colorClass="bg-brand-900" label="Hiver" />
                <LegendDot
                  colorClass="bg-slate-300"
                  label="Sans date exploitable"
                />
                {stats.seasonSplit.shoulderCount > 0 && (
                  <span>
                    {stats.seasonSplit.shoulderCount} offre
                    {stats.seasonSplit.shoulderCount > 1 ? "s" : ""} sans date
                    d&apos;envoi exploitable.
                  </span>
                )}
              </div>
            </>
          ) : (
            <p className="mt-4 text-sm text-slate-500">
              Ajoutez des dates d&apos;envoi pour distinguer les saisons.
            </p>
          )}
        </article>
      </section>

      {/* ─── Évolutions N vs N-1 ─── */}
      {evolution && (
        <section>
          <SectionHeader
            title={`Évolutions ${selectedYear} vs ${evolution.prevYear}`}
            description="Comparaison avec l'année précédente."
          />
          <div className="grid gap-4 md:grid-cols-3">
            <EvolutionCard
              label="Total offres"
              current={stats.totalOffers}
              previous={evolution.prev.totalOffers}
            />
            <EvolutionCard
              label="Confirmées"
              current={
                stats.confirmedSplit.hebergement +
                stats.confirmedSplit.activite
              }
              previous={
                evolution.prev.confirmedSplit.hebergement +
                evolution.prev.confirmedSplit.activite
              }
            />
            <EvolutionCard
              label="Taille moy. groupe"
              current={stats.averageGroupSize}
              previous={evolution.prev.averageGroupSize}
              formatValue={(v) =>
                v !== null ? formatNumber(v) : "\u2014"
              }
            />
          </div>
        </section>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Internal components
// ---------------------------------------------------------------------------

function SectionHeader({
  title,
  description,
  size = "base",
}: {
  title: string;
  description: string;
  size?: "base" | "small";
}) {
  const titleClass =
    size === "small"
      ? "text-lg font-semibold text-slate-900"
      : "text-2xl font-semibold text-slate-900";

  return (
    <div className="space-y-1.5">
      <p className={titleClass}>{title}</p>
      <p className="text-sm text-slate-500">{description}</p>
    </div>
  );
}

function HighlightCard({
  label,
  value,
  helperText,
}: {
  label: string;
  value: string;
  helperText: string;
}) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-3 text-2xl font-semibold text-slate-900">{value}</p>
      <p className="mt-2 text-sm text-slate-500">{helperText}</p>
    </article>
  );
}

function SeasonStat({
  label,
  percentage,
  count,
}: {
  label: string;
  percentage: number;
  count: number;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold text-slate-900">
        {formatPercentage(percentage)}
      </p>
      <p className="text-xs text-slate-500">
        {count} offre{count > 1 ? "s" : ""}
      </p>
    </div>
  );
}

function HeaderPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/15 bg-white/10 px-3 py-2">
      <p className="text-[0.7rem] uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="text-lg font-semibold text-white">{value}</p>
    </div>
  );
}

function LegendDot({
  colorClass,
  label,
}: {
  colorClass: string;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className={`h-2 w-2 rounded-full ${colorClass}`} />
      <span>{label}</span>
    </span>
  );
}

function EvolutionCard({
  label,
  current,
  previous,
  formatValue,
}: {
  label: string;
  current: number | null;
  previous: number | null;
  formatValue?: (v: number | null) => string;
}) {
  const fmt = formatValue ?? ((v: number | null) => (v !== null ? String(v) : "\u2014"));
  let variationPct: number | null = null;
  if (
    current !== null &&
    previous !== null &&
    previous > 0
  ) {
    variationPct = ((current - previous) / previous) * 100;
  }

  const arrow =
    variationPct !== null
      ? variationPct > 0
        ? "\u2191"
        : variationPct < 0
          ? "\u2193"
          : "\u2192"
      : null;

  const arrowColor =
    variationPct !== null
      ? variationPct > 0
        ? "text-emerald-600"
        : variationPct < 0
          ? "text-rose-600"
          : "text-slate-500"
      : "";

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-900">
        {fmt(current)}
      </p>
      {variationPct !== null && (
        <p className={`mt-1 text-sm font-medium ${arrowColor}`}>
          {arrow} {numberFormatter.format(Math.abs(variationPct))} %
          <span className="ml-1 font-normal text-slate-400">
            vs {fmt(previous)}
          </span>
        </p>
      )}
    </article>
  );
}

// ---------------------------------------------------------------------------
// Formatters
// ---------------------------------------------------------------------------

function formatPercentage(value: number) {
  return `${numberFormatter.format(value)} %`;
}

function formatNumber(value: number) {
  return numberFormatter.format(value);
}

function clampPercentage(value: number) {
  if (value <= 0) return 0;
  if (value >= 100) return 100;
  return value;
}
