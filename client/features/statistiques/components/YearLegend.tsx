import type { YearFilters } from "../types";
import { yearColor } from "../colors";

export function YearLegend({
  years,
  activeYears,
  allYears,
  onClickYear,
}: {
  years: number[];
  activeYears: YearFilters;
  allYears: number[];
  onClickYear?: (year: number) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1 text-[11px]">
      {years.map((y) => {
        const isOn = activeYears.size === 0 || activeYears.has(y);
        return (
          <button
            key={y}
            type="button"
            onClick={() => onClickYear?.(y)}
            className={`flex items-center gap-1 rounded-full px-2 py-0.5 transition ${
              isOn ? "bg-slate-100 text-slate-700" : "bg-slate-50 text-slate-300 line-through"
            } hover:bg-slate-200`}
          >
            <span className={`inline-block h-2.5 w-2.5 rounded-sm ${isOn ? "" : "opacity-30"}`} style={{ backgroundColor: yearColor(y, allYears) }} />
            {y}
          </button>
        );
      })}
    </div>
  );
}
