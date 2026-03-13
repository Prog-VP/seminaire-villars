"use client";

import type { PageSize } from "../hooks/useOfferPagination";
import { generatePageNumbers } from "../hooks/useOfferPagination";

type PaginationProps = {
  totalFiltered: number;
  pageSize: PageSize;
  onPageSizeChange: (size: PageSize) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  PAGE_SIZE_OPTIONS: readonly (number | "all")[];
};

export function Pagination({
  totalFiltered,
  pageSize,
  onPageSizeChange,
  currentPage,
  totalPages,
  onPageChange,
  PAGE_SIZE_OPTIONS,
}: PaginationProps) {
  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-4 text-sm text-slate-600">
      <div className="flex items-center gap-2">
        <span>Afficher</span>
        <select
          value={pageSize === "all" ? "all" : String(pageSize)}
          onChange={(e) => {
            const val = e.target.value;
            onPageSizeChange(val === "all" ? "all" : Number(val) as 15 | 30 | 50);
          }}
          className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
        >
          {PAGE_SIZE_OPTIONS.map((opt) => (
            <option key={opt} value={opt === "all" ? "all" : String(opt)}>
              {opt === "all" ? "Tous" : opt}
            </option>
          ))}
        </select>
        <span>par page</span>
        <span className="text-slate-400">
          — {totalFiltered} offre{totalFiltered > 1 ? "s" : ""}
        </span>
      </div>

      {pageSize !== "all" && totalPages > 1 && (
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => onPageChange(currentPage - 1)}
            className="rounded-lg border border-slate-200 px-3 py-1.5 font-medium transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent"
          >
            Précédent
          </button>
          {generatePageNumbers(currentPage, totalPages).map((p, i) =>
            p === "..." ? (
              <span key={`dots-${i}`} className="px-1 text-slate-400">...</span>
            ) : (
              <button
                key={p}
                type="button"
                onClick={() => onPageChange(p as number)}
                className={`min-w-[2.25rem] rounded-lg border px-2 py-1.5 text-center font-medium transition ${
                  currentPage === p
                    ? "border-brand-900 bg-brand-900 text-white"
                    : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                {p}
              </button>
            )
          )}
          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange(currentPage + 1)}
            className="rounded-lg border border-slate-200 px-3 py-1.5 font-medium transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent"
          >
            Suivant
          </button>
        </div>
      )}
    </div>
  );
}
