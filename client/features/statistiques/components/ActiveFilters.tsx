import type { Dimension, Filters, YearPin, MonthFilters, YearFilters } from "../types";
import { DIM_LABELS, MONTH_NAMES } from "../types";
import { YEAR_HEX } from "../colors";
import { yearColorIndex } from "../colors";

const closeIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3 w-3 shrink-0">
    <path d="M5.28 4.22a.75.75 0 0 0-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 1 0 1.06 1.06L8 9.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L9.06 8l2.72-2.72a.75.75 0 0 0-1.06-1.06L8 6.94 5.28 4.22Z" />
  </svg>
);

export function ActiveFilters({ filters, yearPin, monthFilters, yearFilters, allYears, hotelFilter, onClear, onClearMonth, onToggleYear, onClearHotel, onClearAll }: {
  filters: Filters;
  yearPin: YearPin;
  monthFilters: MonthFilters;
  yearFilters: YearFilters;
  allYears: number[];
  hotelFilter?: string;
  onClear: (dim: Dimension) => void;
  onClearMonth: (type: "envoi" | "sejour") => void;
  onToggleYear: (year: number) => void;
  onClearHotel: () => void;
  onClearAll: () => void;
}) {
  const entries = Object.entries(filters) as [Dimension, string][];
  const hasMonthEnvoi = monthFilters.envoi != null;
  const hasMonthSejour = monthFilters.sejour != null;
  const hasYearFilter = yearFilters.size > 0;
  const hasHotel = !!hotelFilter;
  const chipCount = entries.length + (hasMonthEnvoi ? 1 : 0) + (hasMonthSejour ? 1 : 0) + (hasYearFilter ? 1 : 0) + (hasHotel ? 1 : 0);
  if (chipCount === 0) return null;

  function yearColorIdx(year: number) {
    return yearColorIndex(year, allYears);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium text-slate-500">Filtres actifs :</span>
      {entries.map(([dim, val]) => {
        const hasPin = yearPin?.dim === dim;
        const pinIdx = hasPin ? yearColorIdx(yearPin!.year) : -1;
        return (
          <button
            key={dim}
            type="button"
            onClick={() => onClear(dim)}
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition ${
              hasPin
                ? "text-white hover:opacity-80"
                : "bg-brand-100 text-brand-700 hover:bg-brand-200"
            }`}
            style={hasPin && pinIdx >= 0 ? { backgroundColor: YEAR_HEX[pinIdx % YEAR_HEX.length] } : undefined}
          >
            {DIM_LABELS[dim]} : {val}{hasPin ? ` (${yearPin!.year})` : ""}
            {closeIcon}
          </button>
        );
      })}
      {hasMonthEnvoi && (
        <button
          type="button"
          onClick={() => onClearMonth("envoi")}
          className="inline-flex items-center gap-1 rounded-full bg-brand-100 px-2.5 py-1 text-xs font-medium text-brand-700 transition hover:bg-brand-200"
        >
          Mois envoi : {MONTH_NAMES[monthFilters.envoi!]}
          {closeIcon}
        </button>
      )}
      {hasMonthSejour && (
        <button
          type="button"
          onClick={() => onClearMonth("sejour")}
          className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700 transition hover:bg-amber-200"
        >
          Mois séjour : {MONTH_NAMES[monthFilters.sejour!]}
          {closeIcon}
        </button>
      )}
      {hasYearFilter && (
        <span className="inline-flex items-center gap-1 text-xs">
          <span className="text-slate-500">Années :</span>
          {Array.from(yearFilters).sort().map((y) => {
            const idx = yearColorIdx(y);
            return (
              <button
                key={y}
                type="button"
                onClick={() => onToggleYear(y)}
                className="inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium text-white transition hover:opacity-80"
                style={{ backgroundColor: idx >= 0 ? YEAR_HEX[idx % YEAR_HEX.length] : "#64748b" }}
              >
                {y}
                {closeIcon}
              </button>
            );
          })}
        </span>
      )}
      {hasHotel && (
        <button
          type="button"
          onClick={onClearHotel}
          className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2.5 py-1 text-xs font-medium text-violet-700 transition hover:bg-violet-200"
        >
          Hôtel : {hotelFilter}
          {closeIcon}
        </button>
      )}
      {chipCount > 1 && (
        <button
          type="button"
          onClick={onClearAll}
          className="text-xs font-medium text-slate-500 underline transition hover:text-slate-700"
        >
          Tout effacer
        </button>
      )}
    </div>
  );
}
