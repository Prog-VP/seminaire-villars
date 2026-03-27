import { useEffect, useRef, useState } from "react";
import type { SortKey, SortConfig } from "../hooks/useOfferFiltering";
import type { useColumnConfig } from "../hooks/useColumnConfig";
import { useColumnDrag } from "../hooks/useColumnDrag";

type ColumnConfig = ReturnType<typeof useColumnConfig>;

type OfferTableHeadProps = {
  columns: ColumnConfig;
  sortConfig: SortConfig;
  onSort: (key: SortKey) => void;
  allPageSelected: boolean;
  onToggleSelectAll: () => void;
};

const SORTABLE_KEYS = new Set([
  "numeroOffre",
  "societeContact",
  "contact",
  "pays",
  "typeSejour",
  "statut",
  "createdAt",
  "relance",
  "hotelSendsCount",
  "hotelResponsesCount",
  "commentsCount",
]);

export function OfferTableHead({
  columns,
  sortConfig,
  onSort,
  allPageSelected,
  onToggleSelectAll,
}: OfferTableHeadProps) {
  const { visibleColumns, hiddenColumns, addColumn, removeColumn, reorderColumns, resetToDefault } = columns;
  const { dragOverIndex, handleDragStart, handleDragEnd, handleDragOver, handleDragLeave, handleDrop } =
    useColumnDrag(reorderColumns);

  return (
    <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
      <tr>
        <th className="px-2 py-1.5">
          <input
            type="checkbox"
            checked={allPageSelected}
            onChange={onToggleSelectAll}
            className="h-3.5 w-3.5 rounded border-slate-300 text-brand-900 focus:ring-brand-500"
          />
        </th>
        <th className="px-2 py-1.5 font-medium text-slate-400">#</th>
        {visibleColumns.map((column, colIndex) => {
          const isSortable = SORTABLE_KEYS.has(column.key);
          const isActive = sortConfig.key === column.key;
          const ariaSort = isActive
            ? sortConfig.direction === "asc"
              ? "ascending"
              : "descending"
            : "none";
          const isDragOver = dragOverIndex === colIndex;

          return (
            <th
              key={column.key}
              className={`group/th px-2 py-1.5 font-medium ${column.cellClass} ${
                isDragOver ? "border-l-2 border-brand-500" : "border-l-2 border-transparent"
              }`}
              aria-sort={isSortable ? ariaSort : undefined}
              draggable
              onDragStart={(e) => handleDragStart(colIndex, e)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => handleDragOver(colIndex, e)}
              onDragLeave={() => handleDragLeave(colIndex)}
              onDrop={(e) => handleDrop(colIndex, e)}
            >
              <span className="flex cursor-grab items-center gap-1">
                {isSortable ? (
                  <button
                    type="button"
                    onClick={() => onSort(column.key as SortKey)}
                    className="flex items-center gap-1 text-slate-600 transition hover:text-slate-900"
                  >
                    <span>{column.label}</span>
                    <SortIndicator active={isActive} direction={sortConfig.direction} />
                  </button>
                ) : (
                  <span className="text-slate-600">{column.label}</span>
                )}
                <RemoveColumnButton onRemove={() => removeColumn(column.key)} />
              </span>
            </th>
          );
        })}
        <th className="px-2 py-1.5">
          <AddColumnPopover hiddenColumns={hiddenColumns} onAdd={addColumn} onReset={resetToDefault} />
        </th>
      </tr>
    </thead>
  );
}

// ─── Sub-components ───

function SortIndicator({ active, direction }: { active: boolean; direction: "asc" | "desc" }) {
  if (!active) {
    return <span aria-hidden className="text-xs leading-none text-slate-300">↕</span>;
  }
  return <span aria-hidden className="text-xs leading-none text-slate-900">{direction === "asc" ? "↑" : "↓"}</span>;
}

function RemoveColumnButton({ onRemove }: { onRemove: () => void }) {
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onRemove(); }}
      className="ml-0.5 hidden text-slate-300 transition hover:text-red-500 group-hover/th:inline-flex"
      title="Masquer cette colonne"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3 w-3">
        <path d="M5.28 4.22a.75.75 0 00-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 101.06 1.06L8 9.06l2.72 2.72a.75.75 0 101.06-1.06L9.06 8l2.72-2.72a.75.75 0 00-1.06-1.06L8 6.94 5.28 4.22z" />
      </svg>
    </button>
  );
}

function AddColumnPopover({
  hiddenColumns,
  onAdd,
  onReset,
}: {
  hiddenColumns: { key: string; label: string }[];
  onAdd: (key: string) => void;
  onReset: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-6 w-6 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-200 hover:text-slate-600"
        title="Ajouter une colonne"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
          <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-56 rounded-xl border border-slate-200 bg-white py-1 shadow-xl">
          <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            Ajouter une colonne
          </p>
          <div className="max-h-64 overflow-y-auto">
            {hiddenColumns.length === 0 ? (
              <p className="px-3 py-2 text-xs text-slate-400">Toutes les colonnes sont affichées</p>
            ) : (
              hiddenColumns.map((col) => (
                <button
                  key={col.key}
                  type="button"
                  onClick={() => onAdd(col.key)}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-slate-700 transition hover:bg-slate-50"
                >
                  <span className="text-slate-400">+</span>
                  {col.label}
                </button>
              ))
            )}
          </div>
          <div className="border-t border-slate-100 px-3 py-1.5">
            <button
              type="button"
              onClick={() => { onReset(); setOpen(false); }}
              className="text-xs text-slate-500 transition hover:text-slate-700"
            >
              Réinitialiser les colonnes
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
