import type { ReactNode } from "react";
import { yearColor } from "../colors";

export type GroupedBarsRow<TId extends string | number> = {
  id: TId;
  label: string;
  yearCounts: Record<number, number>;
};

type BarLabelArgs<TId extends string | number> = {
  row: GroupedBarsRow<TId>;
  year: number;
  value: number;
};

type GroupedBarsProps<TId extends string | number> = {
  rows: GroupedBarsRow<TId>[];
  visibleYears: number[];
  allYears: number[];
  max: number;
  chartHeight: number;
  barWidth: number;
  groupGapClassName?: string;
  paddingClassName?: string;
  minWidthPadding?: number;
  activeId?: TId | null;
  onClickRow?: (row: GroupedBarsRow<TId>) => void;
  getBarLabel?: (args: BarLabelArgs<TId>) => ReactNode;
  getBarTitle?: (args: BarLabelArgs<TId>) => string | undefined;
  renderGroupLabel: (row: GroupedBarsRow<TId>, isActive: boolean) => ReactNode;
  renderGroupMeta?: (row: GroupedBarsRow<TId>) => ReactNode;
};

export function GroupedBars<TId extends string | number>({
  rows,
  visibleYears,
  allYears,
  max,
  chartHeight,
  barWidth,
  groupGapClassName = "gap-5",
  paddingClassName = "pb-6 pt-5",
  minWidthPadding = 32,
  activeId,
  onClickRow,
  getBarLabel = ({ value }) => value,
  getBarTitle,
  renderGroupLabel,
  renderGroupMeta,
}: GroupedBarsProps<TId>) {
  return (
    <div className="overflow-x-auto">
      <div
        className={`flex items-end ${groupGapClassName} ${paddingClassName}`}
        style={{ minWidth: rows.length * (visibleYears.length * (barWidth + 4) + minWidthPadding) }}
      >
        {rows.map((row) => {
          const isActive = activeId === row.id;
          const isDimmed = activeId != null && !isActive;
          return (
            <button
              key={row.id}
              type="button"
              onClick={() => onClickRow?.(row)}
              className={`flex flex-col items-center gap-1 transition-opacity ${isDimmed ? "opacity-30" : ""}`}
            >
              <div className="flex flex-col items-center gap-1">
                <div className="flex items-end gap-px" style={{ height: chartHeight }}>
                  {visibleYears.map((year) => {
                    const value = row.yearCounts[year] ?? 0;
                    const height = max > 0 ? (value / max) * chartHeight : 0;
                    return (
                      <div key={year} className="group relative" style={{ width: barWidth }}>
                        <div
                          className="w-full rounded-t transition-opacity hover:opacity-80"
                          style={{ height, backgroundColor: yearColor(year, allYears) }}
                          title={getBarTitle?.({ row, year, value })}
                        />
                        {value > 0 && (
                          <span className="absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] font-semibold tabular-nums text-slate-600">
                            {getBarLabel({ row, year, value })}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="flex gap-px">
                  {visibleYears.map((year) => (
                    <span
                      key={year}
                      className="text-center text-[9px] font-medium tabular-nums text-slate-400"
                      style={{ width: barWidth }}
                    >
                      {year}
                    </span>
                  ))}
                </div>
              </div>
              {renderGroupLabel(row, isActive)}
              {renderGroupMeta?.(row)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
