"use client";

import type { buildOfferStats } from "../utils";
import { fmtPct, clampPct } from "./stat-formatters";
import { SectionHeader, SeasonStat, LegendDot } from "./StatCards";

type Stats = ReturnType<typeof buildOfferStats>;

type PeriodesTabProps = {
  stats: Stats;
};

export function PeriodesTab({ stats }: PeriodesTabProps) {
  return (
    <div className="space-y-6">
      {/* Dates des séjours */}
      {stats.stayMonthDistribution.length > 0 && (
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
                      {fmtPct(item.percentage)}
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
                      width: `${clampPct(item.percentage)}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </article>
      )}

      {/* Période d'envoi + Été vs Hiver */}
      <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
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
                        {fmtPct(item.percentage)}
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
                        width: `${clampPct(item.percentage)}%`,
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
                      width: `${clampPct(stats.seasonSplit.etePercentage)}%`,
                    }}
                  />
                  <div
                    className="h-full bg-brand-900"
                    style={{
                      width: `${clampPct(stats.seasonSplit.hiverPercentage)}%`,
                    }}
                  />
                  <div
                    className="h-full bg-slate-300"
                    style={{
                      width: `${clampPct(stats.seasonSplit.shoulderPercentage)}%`,
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
      </div>
    </div>
  );
}
