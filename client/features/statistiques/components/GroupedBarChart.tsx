import type { EvoDimData, YearFilters } from "../types";
import { CATEGORY_COLORS } from "../colors";
import { pct } from "../data";
import { GroupedBars, type GroupedBarsRow } from "./GroupedBars";
import { PieChart, type PieChartItem } from "./PieChart";
import { YearLegend } from "./YearLegend";

export function GroupedBarChart({
  data,
  limit,
  labelMode = "count",
  activeValue,
  activeYears,
  allYears,
  onClickBar,
  onClickYear,
  hideLegend,
}: {
  data: EvoDimData;
  limit?: number;
  labelMode?: "count" | "rate";
  activeValue?: string;
  activeYears: YearFilters;
  allYears: number[];
  onClickBar?: (value: string) => void;
  onClickYear?: (year: number) => void;
  hideLegend?: boolean;
}) {
  const displayRows = limit ? data.rows.slice(0, limit) : data.rows;
  if (displayRows.length === 0) return <p className="text-sm text-slate-400">Aucune donnée</p>;

  const visibleYears = activeYears.size > 0 ? data.years.filter((y) => activeYears.has(y)) : data.years;
  const max = Math.max(
    ...displayRows.flatMap((r) => visibleYears.map((y) => r.yearCounts[y] ?? 0)),
  );
  const chartH = 130;
  const labelAsRate = labelMode === "rate";
  const barWidth = labelAsRate ? 34 : 28;
  const singleYear = visibleYears.length === 1 ? visibleYears[0] : null;
  const singleYearTotal = singleYear ? data.yearTotals[singleYear] ?? 0 : 0;
  const shouldRenderPie = singleYear !== null && singleYearTotal > 0;

  if (shouldRenderPie) {
    const pieItems = buildPieItems(displayRows, singleYear, singleYearTotal);

    return (
      <div className="space-y-2">
        {!hideLegend && (
          <YearLegend
            years={data.years}
            activeYears={activeYears}
            allYears={allYears}
            onClickYear={onClickYear}
          />
        )}
        <PieChart
          items={pieItems}
          total={singleYearTotal}
          year={singleYear}
          activeLabel={activeValue}
          onClickItem={onClickBar}
        />
      </div>
    );
  }

  const barRows: GroupedBarsRow<string>[] = displayRows.map((row) => ({
    id: row.label,
    label: row.label,
    yearCounts: row.yearCounts,
  }));

  return (
    <div className="space-y-2">
      {!hideLegend && (
        <YearLegend
          years={data.years}
          activeYears={activeYears}
          allYears={allYears}
          onClickYear={onClickYear}
        />
      )}
      <GroupedBars
        rows={barRows}
        visibleYears={visibleYears}
        allYears={allYears}
        max={max}
        chartHeight={chartH}
        barWidth={barWidth}
        activeId={activeValue}
        onClickRow={(row) => onClickBar?.(row.label)}
        getBarLabel={({ value, year }) =>
          labelAsRate ? `${pct(value, data.yearTotals[year] ?? 0)}%` : value
        }
        getBarTitle={({ row, value, year }) => {
          const label = labelAsRate ? `${pct(value, data.yearTotals[year] ?? 0)}%` : value;
          return labelAsRate
            ? `${row.label} (${year}) — ${value} offres, ${label}`
            : `${row.label} (${year}) — ${value}`;
        }}
        renderGroupLabel={(row) => (
          <span className="max-w-[100px] truncate text-[10px] text-slate-500" title={row.label}>
            {row.label}
          </span>
        )}
      />
    </div>
  );
}

function buildPieItems(rows: EvoDimData["rows"], year: number, total: number): PieChartItem[] {
  const rawItems = rows
    .map((row) => ({
      label: row.label,
      value: row.yearCounts[year] ?? 0,
    }))
    .filter((item) => item.value > 0);
  const shownTotal = rawItems.reduce((sum, item) => sum + item.value, 0);
  const otherValue = Math.max(0, total - shownTotal);
  const items = [
    ...rawItems,
    ...(otherValue > 0 ? [{ label: "Autres", value: otherValue, isOther: true }] : []),
  ];

  return items.map((item, index) => ({
    ...item,
    color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
  }));
}
