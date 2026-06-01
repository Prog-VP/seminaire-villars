import { yearColor } from "../colors";
import type { YearFilters } from "../types";

export function YearTotalChart({
  totals,
  activeYears,
  allYears,
  onClickYear,
}: {
  totals: Record<number, number>;
  activeYears: YearFilters;
  allYears: number[];
  onClickYear?: (year: number) => void;
}) {
  const years = Object.keys(totals)
    .map(Number)
    .sort((a, b) => a - b);
  const visibleYears = activeYears.size > 0 ? years.filter((year) => activeYears.has(year)) : years;
  const max = Math.max(...visibleYears.map((year) => totals[year] ?? 0));
  const chartH = 150;

  if (visibleYears.length === 0 || max === 0) {
    return <p className="text-sm text-slate-400">Aucune donnée</p>;
  }

  return (
    <div className="overflow-x-auto">
      <div
        className="flex items-end gap-6 pb-2 pt-6"
        style={{ minWidth: visibleYears.length * 76 }}
      >
        {visibleYears.map((year) => {
          const value = totals[year] ?? 0;
          const height = max > 0 ? (value / max) * chartH : 0;
          return (
            <button
              key={year}
              type="button"
              onClick={() => onClickYear?.(year)}
              className="flex flex-col items-center gap-1.5"
            >
              <div className="relative flex items-end" style={{ height: chartH }}>
                <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-xs font-semibold tabular-nums text-slate-700">
                  {value}
                </span>
                <div
                  className="w-12 rounded-t transition-opacity hover:opacity-80"
                  style={{ height, backgroundColor: yearColor(year, allYears) }}
                />
              </div>
              <span className="text-xs font-medium text-slate-600">{year}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
