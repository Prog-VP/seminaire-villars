import type { Dimension, EvoDimData, YearFilters } from "../types";
import { YEAR_HEX } from "../colors";
import { yearColorIndex } from "../colors";
import { YearLegend } from "./YearLegend";

export function GroupedBarChart({
  data,
  limit,
  dim,
  activeValue,
  activeYears,
  allYears,
  onClickBar,
  onClickYear,
}: {
  data: EvoDimData;
  limit?: number;
  dim: Dimension;
  activeValue?: string;
  activeYears: YearFilters;
  allYears: number[];
  onClickBar?: (value: string) => void;
  onClickYear?: (year: number) => void;
}) {
  const displayRows = limit ? data.rows.slice(0, limit) : data.rows;
  if (displayRows.length === 0) return <p className="text-sm text-slate-400">Aucune donnée</p>;

  const visibleYears = activeYears.size > 0 ? data.years.filter((y) => activeYears.has(y)) : data.years;

  const max = Math.max(
    ...displayRows.flatMap((r) => visibleYears.map((y) => r.yearCounts[y] ?? 0)),
  );
  const chartH = 130;

  return (
    <div className="space-y-2">
      {/* Legend — clickable */}
      <YearLegend years={data.years} activeYears={activeYears} allYears={allYears} onClickYear={onClickYear} />
      {/* Bars */}
      <div className="overflow-x-auto">
        <div
          className="flex items-end gap-4 pb-6"
          style={{ height: chartH + 36, minWidth: displayRows.length * (visibleYears.length * 16 + 24) }}
        >
          {displayRows.map((row) => {
            const isActive = activeValue === row.label;
            const isDimmed = activeValue != null && !isActive;
            return (
              <button
                key={row.label}
                type="button"
                onClick={() => onClickBar?.(row.label)}
                className={`flex flex-col items-center gap-1 transition-opacity ${isDimmed ? "opacity-30" : ""} ${isActive ? "opacity-100" : ""}`}
              >
                <div className="flex items-end gap-px" style={{ height: chartH }}>
                  {visibleYears.map((y) => {
                    const ci = yearColorIndex(y, allYears);
                    const v = row.yearCounts[y] ?? 0;
                    const h = max > 0 ? (v / max) * chartH : 0;
                    return (
                      <div key={y} className="group relative" style={{ width: 14 }}>
                        <div
                          className="w-full rounded-t transition-opacity hover:opacity-80"
                          style={{ height: h, backgroundColor: YEAR_HEX[ci % YEAR_HEX.length] }}
                        />
                        {v > 0 && (
                          <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[9px] tabular-nums text-slate-500 opacity-0 transition group-hover:opacity-100">
                            {v}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
                <span className="max-w-[80px] truncate text-[10px] text-slate-500" title={row.label}>
                  {row.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
