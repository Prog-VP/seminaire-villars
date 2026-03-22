import React from "react";

export function Section({
  title,
  children,
  filterActive,
  onClear,
}: {
  title: string;
  children: React.ReactNode;
  filterActive?: boolean;
  onClear?: () => void;
}) {
  return (
    <div
      className={`rounded-xl border bg-white p-5 shadow-sm transition-colors overflow-visible ${
        filterActive ? "border-brand-300 ring-1 ring-brand-200" : "border-slate-200"
      }`}
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">{title}</h3>
        {filterActive && onClear && (
          <button
            type="button"
            onClick={onClear}
            className="rounded-md px-2 py-0.5 text-xs font-medium text-brand-600 transition hover:bg-brand-50"
          >
            Effacer
          </button>
        )}
      </div>
      {children}
    </div>
  );
}
