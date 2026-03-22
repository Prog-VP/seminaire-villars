"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Offer } from "../types";
import type { SortKey } from "../hooks/useOfferFiltering";
import { deleteOffer, duplicateOffer } from "../api";
import { exportOffersXLSX } from "../import";
import { useOfferFiltering } from "../hooks/useOfferFiltering";
import { useOfferPagination } from "../hooks/useOfferPagination";
import { useOfferSelection } from "../hooks/useOfferSelection";
import { useColumnConfig } from "../hooks/useColumnConfig";
import { OfferFilters } from "./OfferFilters";
import { ImportOffersDropzone } from "./ImportOffersDropzone";
import { saveOfferListIds } from "./OfferNavArrows";
import { OfferTableRow } from "./OfferTableRow";
import { SelectionActionBar } from "./SelectionActionBar";
import { useSettings } from "@/features/settings/context";
import { Pagination } from "./Pagination";
import { ConfirmModal, DuplicateModal } from "./OfferModals";

type OfferTableProps = {
  data: Offer[];
  errorMessage?: string | null;
};

type ModalState =
  | { type: "none" }
  | { type: "delete"; ids: string[] }
  | { type: "duplicate"; ids: string[] };

function SortIndicator({
  active,
  direction,
}: {
  active: boolean;
  direction: "asc" | "desc";
}) {
  if (!active) {
    return (
      <span aria-hidden className="text-xs leading-none text-slate-300">
        ↕
      </span>
    );
  }

  return (
    <span aria-hidden className="text-xs leading-none text-slate-900">
      {direction === "asc" ? "↑" : "↓"}
    </span>
  );
}

// ─── Add Column Popover ───

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
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
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
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="h-4 w-4"
        >
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
              <p className="px-3 py-2 text-xs text-slate-400">
                Toutes les colonnes sont affichées
              </p>
            ) : (
              hiddenColumns.map((col) => (
                <button
                  key={col.key}
                  type="button"
                  onClick={() => {
                    onAdd(col.key);
                  }}
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
              onClick={() => {
                onReset();
                setOpen(false);
              }}
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

// ─── Column remove button (shown on hover) ───

function RemoveColumnButton({ onRemove }: { onRemove: () => void }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onRemove();
      }}
      className="ml-0.5 hidden text-slate-300 transition hover:text-red-500 group-hover/th:inline-flex"
      title="Masquer cette colonne"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 16 16"
        fill="currentColor"
        className="h-3 w-3"
      >
        <path d="M5.28 4.22a.75.75 0 00-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 101.06 1.06L8 9.06l2.72 2.72a.75.75 0 101.06-1.06L9.06 8l2.72-2.72a.75.75 0 00-1.06-1.06L8 6.94 5.28 4.22z" />
      </svg>
    </button>
  );
}

// ─── Main OfferTable ───

export function OfferTable({ data, errorMessage }: OfferTableProps) {
  const router = useRouter();
  const [showImport, setShowImport] = useState(false);
  const [modal, setModal] = useState<ModalState>({ type: "none" });
  const [actionLoading, setActionLoading] = useState(false);
  const { settings } = useSettings();
  const statutColorMap = useMemo(
    () =>
      Object.fromEntries(
        settings.statut.map((s) => [s.label, s.color ?? null])
      ),
    [settings.statut]
  );

  const cellExtra = useMemo(() => ({ statutColorMap }), [statutColorMap]);

  const {
    filters,
    sortConfig,
    handleSort,
    sortedOffers,
    handleFilterChange: rawHandleFilterChange,
    handleResetFilters: rawHandleResetFilters,
    hotelOptions,
    anneeOptions,
    hasActiveFilters,
  } = useOfferFiltering(data);

  const {
    pageSize,
    setPageSize,
    currentPage,
    setCurrentPage,
    totalPages,
    safePage,
    paginatedItems: paginatedOffers,
    totalFiltered,
    PAGE_SIZE_OPTIONS,
  } = useOfferPagination(sortedOffers);

  const {
    selectedIds,
    toggleSelect,
    toggleSelectAll,
    allPageSelected,
    someSelected,
    clearSelection,
  } = useOfferSelection(paginatedOffers);

  const {
    visibleColumns,
    hiddenColumns,
    addColumn,
    removeColumn,
    reorderColumns,
    resetToDefault,
  } = useColumnConfig();

  const handleFilterChange = (
    nextFilters: Parameters<typeof rawHandleFilterChange>[0]
  ) => {
    rawHandleFilterChange(nextFilters);
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    rawHandleResetFilters();
    setCurrentPage(1);
  };

  const handleNavigate = (id: string) => {
    window.open(`/offres/${id}`, "_blank");
  };

  useEffect(() => {
    saveOfferListIds(sortedOffers.map((o) => o.id));
  }, [sortedOffers]);

  // ─── Drag & drop state ───
  const dragIndexRef = useRef<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const noResults = totalFiltered === 0;

  // Known sortable keys (from useOfferFiltering getSortValue)
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

  return (
    <section>
      <header className="mb-6 flex flex-wrap items-center gap-4">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-slate-900">Offres</h2>
          <p className="text-sm text-slate-500">
            Aperçu des demandes clients synchronisées à partir de la base.
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => exportOffersXLSX(sortedOffers)}
            disabled={sortedOffers.length === 0}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-40"
          >
            Exporter (Excel)
          </button>
          <button
            type="button"
            onClick={() => setShowImport((prev) => !prev)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          >
            {showImport ? "Masquer l'import" : "Importer (Excel)"}
          </button>
          <Link
            href="/offres/nouvelle"
            className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-brand-900 to-brand-700 px-4 py-2 text-sm font-medium text-white transition hover:from-brand-800 hover:to-brand-600"
          >
            <span aria-hidden className="text-base leading-none">
              +
            </span>
            Créer une offre
          </Link>
        </div>
      </header>

      {showImport && (
        <div className="mb-6">
          <ImportOffersDropzone onImportDone={() => router.refresh()} />
        </div>
      )}

      <div className="mb-6">
        <OfferFilters
          filters={filters}
          onChange={handleFilterChange}
          onReset={handleResetFilters}
          hotelContacteOptions={hotelOptions.contactes}
          hotelReponduOptions={hotelOptions.repondus}
          anneeOptions={anneeOptions}
        />
      </div>

      {someSelected && (
        <SelectionActionBar
          count={selectedIds.size}
          onDuplicate={() =>
            setModal({ type: "duplicate", ids: [...selectedIds] })
          }
          onDelete={() =>
            setModal({ type: "delete", ids: [...selectedIds] })
          }
          onDeselect={clearSelection}
        />
      )}

      {hasActiveFilters && (
        <div className="mb-4 flex items-center gap-3">
          <p className="text-sm text-slate-500">
            {totalFiltered} résultat{totalFiltered > 1 ? "s" : ""} sur{" "}
            {data.length}
          </p>
          <button
            type="button"
            onClick={handleResetFilters}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
          >
            <span aria-hidden className="text-xs">
              ✕
            </span>
            Effacer les filtres
          </button>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-2 py-1.5">
                <input
                  type="checkbox"
                  checked={allPageSelected}
                  onChange={toggleSelectAll}
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
                      isDragOver
                        ? "border-l-2 border-brand-500"
                        : "border-l-2 border-transparent"
                    }`}
                    aria-sort={isSortable ? ariaSort : undefined}
                    draggable
                    onDragStart={(e) => {
                      dragIndexRef.current = colIndex;
                      e.dataTransfer.effectAllowed = "move";
                      // Make the drag image slightly transparent
                      if (e.currentTarget instanceof HTMLElement) {
                        e.currentTarget.style.opacity = "0.5";
                      }
                    }}
                    onDragEnd={(e) => {
                      dragIndexRef.current = null;
                      setDragOverIndex(null);
                      if (e.currentTarget instanceof HTMLElement) {
                        e.currentTarget.style.opacity = "";
                      }
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = "move";
                      setDragOverIndex(colIndex);
                    }}
                    onDragLeave={() => {
                      setDragOverIndex((prev) =>
                        prev === colIndex ? null : prev
                      );
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      const from = dragIndexRef.current;
                      if (from !== null && from !== colIndex) {
                        reorderColumns(from, colIndex);
                      }
                      dragIndexRef.current = null;
                      setDragOverIndex(null);
                    }}
                  >
                    <span className="flex cursor-grab items-center gap-1">
                      {isSortable ? (
                        <button
                          type="button"
                          onClick={() =>
                            handleSort(column.key as SortKey)
                          }
                          className="flex items-center gap-1 text-slate-600 transition hover:text-slate-900"
                        >
                          <span>{column.label}</span>
                          <SortIndicator
                            active={isActive}
                            direction={sortConfig.direction}
                          />
                        </button>
                      ) : (
                        <span className="text-slate-600">
                          {column.label}
                        </span>
                      )}
                      <RemoveColumnButton
                        onRemove={() => removeColumn(column.key)}
                      />
                    </span>
                  </th>
                );
              })}
              <th className="px-2 py-1.5">
                <AddColumnPopover
                  hiddenColumns={hiddenColumns}
                  onAdd={addColumn}
                  onReset={resetToDefault}
                />
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedOffers.map((offer, index) => (
              <OfferTableRow
                key={offer.id}
                offer={offer}
                index={index}
                globalIndex={
                  pageSize === "all"
                    ? index + 1
                    : (safePage - 1) * (pageSize as number) + index + 1
                }
                isSelected={selectedIds.has(offer.id)}
                onToggleSelect={toggleSelect}
                onNavigate={handleNavigate}
                columns={visibleColumns}
                cellExtra={cellExtra}
              />
            ))}
            {noResults && (
              <tr>
                <td
                  colSpan={visibleColumns.length + 3}
                  className="px-6 py-8 text-center text-sm text-slate-500"
                >
                  {errorMessage && data.length === 0
                    ? errorMessage
                    : data.length === 0
                      ? "Aucune offre disponible pour le moment."
                      : "Aucune offre ne correspond aux filtres."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalFiltered > 0 && (
        <Pagination
          totalFiltered={totalFiltered}
          pageSize={pageSize}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setCurrentPage(1);
          }}
          currentPage={safePage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          PAGE_SIZE_OPTIONS={PAGE_SIZE_OPTIONS}
        />
      )}

      {modal.type === "delete" && (
        <ConfirmModal
          title="Supprimer les offres"
          description={`Êtes-vous sûr de vouloir supprimer ${modal.ids.length} offre${modal.ids.length > 1 ? "s" : ""} ? Les annexes et les réponses d'hôtels associées seront également supprimées. Cette action est irréversible.`}
          confirmLabel="Supprimer"
          confirmClass="bg-red-600 text-white hover:bg-red-700"
          loading={actionLoading}
          onCancel={() => setModal({ type: "none" })}
          onConfirm={async () => {
            setActionLoading(true);
            try {
              for (const id of modal.ids) {
                await deleteOffer(id);
              }
              clearSelection();
              setModal({ type: "none" });
              router.refresh();
            } catch (err) {
              alert(
                err instanceof Error
                  ? err.message
                  : "Erreur lors de la suppression."
              );
            } finally {
              setActionLoading(false);
            }
          }}
        />
      )}

      {modal.type === "duplicate" && (
        <DuplicateModal
          count={modal.ids.length}
          loading={actionLoading}
          onCancel={() => setModal({ type: "none" })}
          onConfirm={async (opts) => {
            setActionLoading(true);
            try {
              for (const id of modal.ids) {
                await duplicateOffer(id, opts);
              }
              clearSelection();
              setModal({ type: "none" });
              router.refresh();
            } catch (err) {
              alert(
                err instanceof Error
                  ? err.message
                  : "Erreur lors de la duplication."
              );
            } finally {
              setActionLoading(false);
            }
          }}
        />
      )}
    </section>
  );
}
