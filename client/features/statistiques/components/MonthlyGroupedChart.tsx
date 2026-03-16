import type { MonthlyData, YearFilters } from "../types";
import { MONTH_NAMES } from "../types";
import { YEAR_HEX } from "../colors";
import { yearColorIndex } from "../colors";
import { YearLegend } from "./YearLegend";

export function MonthlyGroupedChart({
  data,
  activeMonth,
  activeYears,
  allYears,
  onClickMonth,
  onClickYear,
}: {
  data: MonthlyData;
  activeMonth?: number;
  activeYears: YearFilters;
  allYears: number[];
  onClickMonth?: (month: number) => void;
  onClickYear?: (year: number) => void;
}) {
  const visibleYears = activeYears.size > 0 ? data.years.filter((y) => activeYears.has(y)) : data.years;

  const max = Math.max(
    ...data.months.flatMap((m) => visibleYears.map((y) => m.yearCounts[y] ?? 0)),
  );
  const chartH = 180;

  if (max === 0) return <p className="text-sm text-slate-400">Aucune donnée</p>;

  return (
    <div className="space-y-2">
      {/* Legend — clickable years */}
      <YearLegend years={data.years} activeYears={activeYears} allYears={allYears} onClickYear={onClickYear} />
      {/* Chart */}
      <div className="flex items-end gap-3 pb-1" style={{ height: chartH + 30 }}>
        {data.months.map(({ month, yearCounts }) => {
          const isActive = activeMonth === month;
          const isDimmed = activeMonth != null && !isActive;
          const visTotal = visibleYears.reduce((s, y) => s + (yearCounts[y] ?? 0), 0);
          return (
            <button
              key={month}
              type="button"
              onClick={() => onClickMonth?.(month)}
              className={`flex flex-1 flex-col items-center gap-1 transition-opacity ${isDimmed ? "opacity-25" : ""}`}
            >
              <div className="flex items-end gap-px" style={{ height: chartH }}>
                {visibleYears.map((y) => {
                  const ci = yearColorIndex(y, allYears);
                  const v = yearCounts[y] ?? 0;
                  const h = max > 0 ? (v / max) * chartH : 0;
                  return (
                    <div key={y} className="group relative" style={{ width: Math.max(8, Math.min(18, 120 / visibleYears.length)) }}>
                      <div
                        className="w-full rounded-t transition-opacity hover:opacity-80"
                        style={{ height: h, backgroundColor: YEAR_HEX[ci % YEAR_HEX.length] }}
                      />
                      {v > 0 && (
                        <span className="absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] tabular-nums text-slate-500 opacity-0 transition group-hover:opacity-100">
                          {v}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
              <span className={`text-[11px] font-medium ${isActive ? "text-brand-700" : "text-slate-500"}`}>
                {MONTH_NAMES[month]}
              </span>
              {visTotal > 0 && (
                <span className="text-[9px] tabular-nums text-slate-400">{visTotal}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
