"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Offer } from "../types";
import { exportOffersXLSX } from "../import";
import { useOfferFiltering } from "../hooks/useOfferFiltering";
import { useOfferPagination } from "../hooks/useOfferPagination";
import { useOfferSelection } from "../hooks/useOfferSelection";
import { useColumnConfig } from "../hooks/useColumnConfig";
import { useOfferTableModals } from "../hooks/useOfferTableModals";
import { OfferFilters } from "./OfferFilters";
import { ImportOffersDropzone } from "./ImportOffersDropzone";
import { saveOfferListIds } from "./OfferNavArrows";
import { OfferTableRow } from "./OfferTableRow";
import { OfferTableHead } from "./OfferTableHead";
import { SelectionActionBar } from "./SelectionActionBar";
import { useSettings } from "@/features/settings/context";
import { Pagination } from "./Pagination";
import { ConfirmModal, DuplicateModal } from "./OfferModals";

type OfferTableProps = {
  data: Offer[];
  errorMessage?: string | null;
};

export function OfferTable({ data, errorMessage }: OfferTableProps) {
  const router = useRouter();
  const [showImport, setShowImport] = useState(false);
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

  const columnConfig = useColumnConfig();

  const {
    modal,
    actionLoading,
    openDelete,
    openDuplicate,
    closeModal,
    confirmDelete,
    confirmDuplicate,
  } = useOfferTableModals(clearSelection);

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

  const noResults = totalFiltered === 0;

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
          onDuplicate={() => openDuplicate([...selectedIds])}
          onDelete={() => openDelete([...selectedIds])}
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
          <OfferTableHead
            columns={columnConfig}
            sortConfig={sortConfig}
            onSort={handleSort}
            allPageSelected={allPageSelected}
            onToggleSelectAll={toggleSelectAll}
          />
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
                columns={columnConfig.visibleColumns}
                cellExtra={cellExtra}
              />
            ))}
            {noResults && (
              <tr>
                <td
                  colSpan={columnConfig.visibleColumns.length + 3}
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
          onCancel={closeModal}
          onConfirm={confirmDelete}
        />
      )}

      {modal.type === "duplicate" && (
        <DuplicateModal
          count={modal.ids.length}
          loading={actionLoading}
          onCancel={closeModal}
          onConfirm={confirmDuplicate}
        />
      )}
    </section>
  );
}
