"use client";

import React, { useMemo } from "react";
import type { Offer } from "@/features/offres/types";
import type { HotelRow, YearFilters } from "../types";
import { yearColor } from "../colors";
import { getYear } from "../data";
import { Section } from "./Section";

export function HotelStatsTab({ offers, allYears, yearFilters, activeHotel, onToggleHotel }: {
  offers: Offer[];
  allYears: number[];
  yearFilters: YearFilters;
  activeHotel?: string;
  onToggleHotel: (name: string) => void;
}) {
  const visibleYears = yearFilters.size > 0 ? allYears.filter((y) => yearFilters.has(y)) : allYears;

  const data = useMemo(() => {
    const map: Record<string, { contacted: Record<number, number>; responded: Record<number, number> }> = {};

    for (const o of offers) {
      const y = getYear(o.dateEnvoiOffre);
      if (!y) continue;

      // Hotels contacted
      if (o.hotelSendsNames) {
        for (const name of o.hotelSendsNames) {
          if (!map[name]) map[name] = { contacted: {}, responded: {} };
          map[name].contacted[y] = (map[name].contacted[y] ?? 0) + 1;
        }
      }

      // Hotels responded
      if (o.hotelResponses) {
        for (const r of o.hotelResponses) {
          const name = r.hotelName;
          if (!map[name]) map[name] = { contacted: {}, responded: {} };
          map[name].responded[y] = (map[name].responded[y] ?? 0) + 1;
        }
      }
    }

    const rows: HotelRow[] = Object.entries(map)
      .map(([name, { contacted, responded }]) => {
        const totalContacted = visibleYears.reduce((s, y) => s + (contacted[y] ?? 0), 0);
        const totalResponded = visibleYears.reduce((s, y) => s + (responded[y] ?? 0), 0);
        return { name, contacted, responded, totalContacted, totalResponded };
      })
      .filter((r) => r.totalContacted > 0 || r.totalResponded > 0)
      .sort((a, b) => b.totalContacted - a.totalContacted);

    return rows;
  }, [offers, visibleYears]);

  const grandContacted = data.reduce((s, r) => s + r.totalContacted, 0);
  const grandResponded = data.reduce((s, r) => s + r.totalResponded, 0);

  // Bar chart data: top hotels by contacted
  const chartMax = data.length > 0 ? data[0].totalContacted : 0;

  return (
    <div className="space-y-5">
      {/* Bar chart: top hotels */}
      <Section title="Hôtels les plus contactés">
        {data.length === 0 ? (
          <p className="text-sm text-slate-400">Aucune donnée</p>
        ) : (
          <div className="space-y-1.5 overflow-x-auto">
            {data.slice(0, 20).map((row) => {
              const isActive = activeHotel === row.name;
              const isDimmed = activeHotel != null && !isActive;
              return (
              <button
                key={row.name}
                type="button"
                onClick={() => onToggleHotel(row.name)}
                className={`flex w-full items-center gap-2 rounded-lg px-1 py-0.5 text-sm transition-colors hover:bg-slate-50 ${
                  isActive ? "bg-brand-50 ring-1 ring-brand-300" : ""
                } ${isDimmed ? "opacity-40" : ""}`}
              >
                <span className="w-40 shrink-0 truncate text-right text-slate-600" title={row.name}>
                  {row.name}
                </span>
                <div className="relative h-5 flex-1 rounded bg-slate-100">
                  <div
                    className="absolute inset-y-0 left-0 rounded bg-brand-600"
                    style={{ width: `${chartMax > 0 ? (row.totalContacted / chartMax) * 100 : 0}%` }}
                  />
                  {row.totalResponded > 0 && (
                    <div
                      className="absolute inset-y-0 left-0 rounded bg-emerald-500"
                      style={{ width: `${chartMax > 0 ? (row.totalResponded / chartMax) * 100 : 0}%` }}
                    />
                  )}
                </div>
                <span className="w-20 shrink-0 text-right tabular-nums text-xs text-slate-600">
                  {row.totalContacted} <span className="text-emerald-600">({row.totalResponded})</span>
                </span>
              </button>
              );
            })}
            <div className="mt-2 flex gap-4 text-[11px] text-slate-500">
              <span className="flex items-center gap-1">
                <span className="inline-block h-2.5 w-2.5 rounded-sm bg-brand-600" />
                Contactés
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block h-2.5 w-2.5 rounded-sm bg-emerald-500" />
                Réponses
              </span>
            </div>
          </div>
        )}
      </Section>

      {/* Detail table */}
      <Section title="Détail par hôtel et par année">
        {data.length === 0 ? (
          <p className="text-sm text-slate-400">Aucune donnée</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-2 py-2 text-left">Hôtel</th>
                  {visibleYears.map((y) => {
                    return (
                      <th key={y} className="px-2 py-2 text-center" colSpan={2}>
                        <span className="inline-block h-2 w-2 rounded-full mr-1 align-middle" style={{ backgroundColor: yearColor(y, allYears) }} />
                        {y}
                      </th>
                    );
                  })}
                  <th className="px-2 py-2 text-center" colSpan={2}>Total</th>
                </tr>
                <tr className="border-b border-slate-100 text-[10px] uppercase tracking-wide text-slate-400">
                  <th />
                  {visibleYears.map((y) => (
                    <React.Fragment key={y}>
                      <th className="px-1 py-1 text-right font-medium">Cont.</th>
                      <th className="px-1 py-1 text-right font-medium text-emerald-500">Rép.</th>
                    </React.Fragment>
                  ))}
                  <th className="px-1 py-1 text-right font-medium">Cont.</th>
                  <th className="px-1 py-1 text-right font-medium text-emerald-500">Rép.</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row, ri) => {
                  const isActive = activeHotel === row.name;
                  const isDimmed = activeHotel != null && !isActive;
                  return (
                  <tr
                    key={row.name}
                    onClick={() => onToggleHotel(row.name)}
                    className={`cursor-pointer border-t border-slate-100 transition hover:bg-slate-50 ${
                      ri % 2 === 1 ? "bg-slate-50/40" : ""
                    } ${isActive ? "bg-brand-50/60" : ""} ${isDimmed ? "opacity-40" : ""}`}
                  >
                    <td className="px-2 py-1.5 font-medium text-slate-700 max-w-[180px] truncate hover:text-brand-700 hover:underline" title={row.name}>
                      {row.name}
                    </td>
                    {visibleYears.map((y) => {
                      const c = row.contacted[y] ?? 0;
                      const r = row.responded[y] ?? 0;
                      return (
                        <React.Fragment key={y}>
                          <td className="px-1 py-1.5 text-right tabular-nums text-xs">
                            {c > 0 ? c : <span className="text-slate-300">—</span>}
                          </td>
                          <td className="px-1 py-1.5 text-right tabular-nums text-xs text-emerald-600">
                            {r > 0 ? r : <span className="text-slate-300">—</span>}
                          </td>
                        </React.Fragment>
                      );
                    })}
                    <td className="px-1 py-1.5 text-right tabular-nums font-semibold text-slate-800">
                      {row.totalContacted}
                    </td>
                    <td className="px-1 py-1.5 text-right tabular-nums font-semibold text-emerald-600">
                      {row.totalResponded}
                    </td>
                  </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-200 font-semibold text-slate-700">
                  <td className="px-2 py-2">Total</td>
                  {visibleYears.map((y) => {
                    const yContacted = data.reduce((s, r) => s + (r.contacted[y] ?? 0), 0);
                    const yResponded = data.reduce((s, r) => s + (r.responded[y] ?? 0), 0);
                    return (
                      <React.Fragment key={y}>
                        <td className="px-1 py-2 text-right tabular-nums">{yContacted}</td>
                        <td className="px-1 py-2 text-right tabular-nums text-emerald-600">{yResponded}</td>
                      </React.Fragment>
                    );
                  })}
                  <td className="px-1 py-2 text-right tabular-nums">{grandContacted}</td>
                  <td className="px-1 py-2 text-right tabular-nums text-emerald-600">{grandResponded}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </Section>
    </div>
  );
}
