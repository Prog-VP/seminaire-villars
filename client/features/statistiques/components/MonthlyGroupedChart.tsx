import type { MonthlyData, YearFilters } from "../types";
import { MONTH_NAMES } from "../types";
import { GroupedBars, type GroupedBarsRow } from "./GroupedBars";
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
  const chartH = 140;
  const barWidth = Math.max(24, Math.min(30, 140 / Math.max(1, visibleYears.length)));

  if (max === 0) return <p className="text-sm text-slate-400">Aucune donnée</p>;

  const rows: GroupedBarsRow<number>[] = data.months.map(({ month, yearCounts }) => ({
    id: month,
    label: MONTH_NAMES[month],
    yearCounts,
  }));

  return (
    <div className="space-y-2">
      <YearLegend years={data.years} activeYears={activeYears} allYears={allYears} onClickYear={onClickYear} />
      <GroupedBars
        rows={rows}
        visibleYears={visibleYears}
        allYears={allYears}
        max={max}
        chartHeight={chartH}
        barWidth={barWidth}
        groupGapClassName="gap-3"
        paddingClassName="pb-1 pt-5"
        minWidthPadding={24}
        activeId={activeMonth}
        onClickRow={(row) => onClickMonth?.(row.id)}
        renderGroupLabel={(row, isActive) => (
          <span className={`text-[11px] font-medium ${isActive ? "text-brand-700" : "text-slate-500"}`}>
            {row.label}
          </span>
        )}
        renderGroupMeta={(row) => {
          const visibleTotal = visibleYears.reduce((sum, year) => sum + (row.yearCounts[year] ?? 0), 0);
          return visibleTotal > 0 ? (
            <span className="text-[9px] tabular-nums text-slate-400">{visibleTotal}</span>
          ) : null;
        }}
      />
    </div>
  );
}
