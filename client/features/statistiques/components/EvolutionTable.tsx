"use client";

import { useMemo } from "react";
import type { Dimension, EvoDimData, YearFilters } from "../types";
import { DIM_LABELS } from "../types";
import { YEAR_BG, YEAR_HEX } from "../colors";
import { yearColorIndex } from "../colors";
import { pct } from "../data";

export function EvolutionTable({
  data,
  dim,
  limit,
  activeValue,
  activeYear,
  activeYears,
  allYears,
  onClickRow,
  onClickCell,
}: {
  data: EvoDimData;
  dim: Dimension;
  limit?: number;
  activeValue?: string;
  activeYear?: number | null;
  activeYears: YearFilters;
  allYears: number[];
  onClickRow?: (label: string) => void;
  onClickCell?: (label: string, year: number) => void;
}) {
  const visibleYears = activeYears.size > 0 ? data.years.filter((y) => activeYears.has(y)) : data.years;

  // Recompute rows/totals for visible years only
  const displayRows = useMemo(() => {
    const rows = data.rows.map((r) => {
      const total = visibleYears.reduce((s, y) => s + (r.yearCounts[y] ?? 0), 0);
      return { ...r, total };
    }).filter((r) => r.total > 0).sort((a, b) => b.total - a.total);
    return limit ? rows.slice(0, limit) : rows;
  }, [data.rows, visibleYears, limit]);

  const visYearTotals: Record<number, number> = {};
  for (const y of visibleYears) {
    visYearTotals[y] = displayRows.reduce((s, r) => s + (r.yearCounts[y] ?? 0), 0);
  }
  const grandTotal = displayRows.reduce((s, r) => s + r.total, 0);

  if (displayRows.length === 0) return null;

  const maxCell = Math.max(
    ...displayRows.flatMap((r) => visibleYears.map((y) => r.yearCounts[y] ?? 0)),
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <th className="px-2 py-2 text-left">{DIM_LABELS[dim]}</th>
            {visibleYears.map((y) => {
              const ci = yearColorIndex(y, allYears);
              return (
                <th key={y} className="px-2 py-2 text-right">
                  <span className={`inline-block h-2 w-2 rounded-full ${YEAR_BG[ci % YEAR_BG.length]} mr-1 align-middle`} />
                  {y}
                </th>
              );
            })}
            <th className="px-2 py-2 text-right">Total</th>
            <th className="px-2 py-2 text-right">%</th>
          </tr>
        </thead>
        <tbody>
          {displayRows.map((row, ri) => {
            const isRowActive = activeValue === row.label;
            const isDimmed = activeValue != null && !isRowActive;
            return (
              <tr
                key={row.label}
                className={`border-t border-slate-100 transition ${
                  ri % 2 === 1 ? "bg-slate-50/40" : ""
                } ${isRowActive ? "bg-brand-50/60" : ""} ${isDimmed ? "opacity-40" : ""}`}
              >
                <td
                  onClick={() => onClickRow?.(row.label)}
                  className="cursor-pointer px-2 py-1.5 font-medium text-slate-700 max-w-[160px] truncate hover:text-brand-700 hover:underline"
                  title={`Filtrer par ${row.label}`}
                >
                  {row.label}
                </td>
                {visibleYears.map((y) => {
                  const ci = yearColorIndex(y, allYears);
                  const v = row.yearCounts[y] ?? 0;
                  const intensity = maxCell > 0 ? v / maxCell : 0;
                  const isCellActive = isRowActive && activeYear === y;
                  return (
                    <td key={y} className="px-2 py-1.5 text-right tabular-nums">
                      {v > 0 ? (
                        <button
                          type="button"
                          onClick={() => onClickCell?.(row.label, y)}
                          title={`Voir les ${v} offres — ${row.label} (${y})`}
                          className={`inline-block min-w-[28px] rounded px-1.5 py-0.5 text-xs font-medium transition hover:ring-2 hover:ring-brand-300 ${
                            isCellActive ? "ring-2 ring-brand-500 scale-110" : ""
                          }`}
                          style={{
                            backgroundColor: `color-mix(in srgb, ${YEAR_HEX[ci % YEAR_HEX.length]} ${Math.max(15, intensity * 55)}%, transparent)`,
                            color: intensity > 0.4 ? "white" : undefined,
                          }}
                        >
                          {v}
                        </button>
                      ) : (
                        <span className="text-xs text-slate-300">—</span>
                      )}
                    </td>
                  );
                })}
                <td
                  onClick={() => onClickRow?.(row.label)}
                  className="cursor-pointer px-2 py-1.5 text-right tabular-nums font-semibold text-slate-800 hover:text-brand-700 hover:underline"
                  title={`Filtrer par ${row.label} (toutes années)`}
                >
                  {row.total}
                </td>
                <td className="px-2 py-1.5 text-right tabular-nums text-xs text-slate-400">
                  {pct(row.total, grandTotal)}%
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-slate-200 font-semibold text-slate-700">
            <td className="px-2 py-2">Total</td>
            {visibleYears.map((y) => (
              <td key={y} className="px-2 py-2 text-right tabular-nums">
                {visYearTotals[y]}
              </td>
            ))}
            <td className="px-2 py-2 text-right tabular-nums">{grandTotal}</td>
            <td className="px-2 py-2 text-right tabular-nums text-xs text-slate-400">100%</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
