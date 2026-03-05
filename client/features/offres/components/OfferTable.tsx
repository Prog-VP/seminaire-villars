"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Offer } from "../types";
import { STATUT_BADGE_STYLES, getStatutLabel } from "../utils";
import { OfferFilters } from "./OfferFilters";
import { ImportOffersDropzone } from "./ImportOffersDropzone";

type BooleanFilterValue = "all" | "true" | "false";

export type OfferFiltersState = {
  societe: string;
  contact: string;
  email: string;
  statut: string;
  typeSociete: Offer["typeSociete"] | "all";
  pays: Offer["pays"] | "all";
  typeSejour: Offer["typeSejour"] | "all";
  stationDemandee: Offer["stationDemandee"] | "all";
  categorieHotel: Offer["categorieHotel"] | "all";
  traitePar: Offer["traitePar"] | "all";
  transmisPar: string;
  paxMin: string;
  paxMax: string;
  reservationEffectuee: BooleanFilterValue;
  contactEntreDansBrevo: BooleanFilterValue;
  hotelContacte: string;
  hotelRepondu: string;
  autres: string;
};

type SortKey =
  | "numeroOffre"
  | "societeContact"
  | "contact"
  | "pays"
  | "typeSejour"
  | "statut"
  | "createdAt"
  | "relance"
  | "hotelSendsCount"
  | "hotelResponsesCount";

type SortConfig = {
  key: SortKey;
  direction: "asc" | "desc";
};

type OfferTableProps = {
  data: Offer[];
  errorMessage?: string | null;
};

const collator = new Intl.Collator("fr", {
  sensitivity: "base",
  usage: "sort",
  numeric: true,
});

const INITIAL_FILTERS: OfferFiltersState = {
  societe: "",
  contact: "",
  email: "",
  statut: "all",
  typeSociete: "all",
  pays: "all",
  typeSejour: "all",
  stationDemandee: "all",
  categorieHotel: "all",
  traitePar: "all",
  transmisPar: "",
  paxMin: "",
  paxMax: "",
  reservationEffectuee: "all",
  contactEntreDansBrevo: "all",
  hotelContacte: "",
  hotelRepondu: "",
  autres: "",
};

const sortableColumns: { label: string; key: SortKey; className?: string }[] = [
  { label: "N°", key: "numeroOffre" },
  { label: "Société", key: "societeContact" },
  { label: "Contact", key: "contact", className: "hidden md:table-cell" },
  { label: "Pays", key: "pays", className: "hidden sm:table-cell" },
  { label: "Type séjour", key: "typeSejour", className: "hidden lg:table-cell" },
  { label: "Statut", key: "statut", className: "hidden sm:table-cell" },
  { label: "Date", key: "createdAt", className: "hidden lg:table-cell" },
  { label: "Relance", key: "relance", className: "hidden lg:table-cell" },
  { label: "Hôtels contactés", key: "hotelSendsCount", className: "hidden lg:table-cell" },
  { label: "Réponses", key: "hotelResponsesCount", className: "hidden lg:table-cell" },
];

function normalize(value?: string | null) {
  return value
    ? value
        .toString()
        .toLowerCase()
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
    : "";
}

function matchesBoolean(filterValue: BooleanFilterValue, actual?: boolean | null) {
  if (filterValue === "all") return true;
  if (filterValue === "true") return actual === true;
  if (filterValue === "false") return actual === false;
  return true;
}

export function OfferTable({ data, errorMessage }: OfferTableProps) {
  const router = useRouter();
  const [showImport, setShowImport] = useState(false);
  const [filters, setFilters] = useState<OfferFiltersState>({
    ...INITIAL_FILTERS,
  });
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "societeContact",
    direction: "asc",
  });

  const handleNavigate = (id: string) => {
    router.push(`/offres/${id}`);
  };

  const filteredOffers = useMemo(() => {
    const normalizedFilters = {
      societe: normalize(filters.societe),
      contact: normalize(filters.contact),
      email: normalize(filters.email),
      transmisPar: normalize(filters.transmisPar),
      autres: normalize(filters.autres),
    };

    const paxMin = filters.paxMin ? Number(filters.paxMin) : null;
    const paxMax = filters.paxMax ? Number(filters.paxMax) : null;
    return data.filter((offer) => {
      if (
        filters.statut !== "all" &&
        (offer.statut ?? "brouillon") !== filters.statut
      ) {
        return false;
      }

      if (
        normalizedFilters.societe &&
        !normalize(offer.societeContact).includes(normalizedFilters.societe)
      ) {
        return false;
      }

      const contactField = normalize(
        [offer.titreContact, offer.prenomContact, offer.nomContact]
          .filter(Boolean)
          .join(" ")
      );
      if (
        normalizedFilters.contact &&
        !contactField.includes(normalizedFilters.contact)
      ) {
        return false;
      }

      if (
        normalizedFilters.email &&
        !normalize(offer.emailContact).includes(normalizedFilters.email)
      ) {
        return false;
      }

      if (
        filters.typeSociete !== "all" &&
        offer.typeSociete !== filters.typeSociete
      ) {
        return false;
      }

      if (filters.pays !== "all" && offer.pays !== filters.pays) {
        return false;
      }

      if (
        filters.typeSejour !== "all" &&
        offer.typeSejour !== filters.typeSejour
      ) {
        return false;
      }

      if (
        filters.stationDemandee !== "all" &&
        offer.stationDemandee !== filters.stationDemandee
      ) {
        return false;
      }

      if (
        filters.categorieHotel !== "all" &&
        !(offer.categorieHotel ?? "").split(",").includes(filters.categorieHotel as string)
      ) {
        return false;
      }

      if (filters.traitePar !== "all" && offer.traitePar !== filters.traitePar) {
        return false;
      }

      if (
        normalizedFilters.transmisPar &&
        !normalize(offer.transmisPar).includes(normalizedFilters.transmisPar)
      ) {
        return false;
      }

      const paxValue = typeof offer.nombrePax === "number" ? offer.nombrePax : null;
      if (paxMin !== null && (paxValue === null || paxValue < paxMin)) {
        return false;
      }

      if (paxMax !== null && (paxValue === null || paxValue > paxMax)) {
        return false;
      }

      if (
        !matchesBoolean(filters.reservationEffectuee, offer.reservationEffectuee)
      ) {
        return false;
      }

      if (
        !matchesBoolean(
          filters.contactEntreDansBrevo,
          offer.contactEntreDansBrevo
        )
      ) {
        return false;
      }

      if (
        normalizedFilters.autres &&
        !normalize(offer.autres).includes(normalizedFilters.autres)
      ) {
        return false;
      }

      if (
        filters.hotelContacte &&
        !(offer.hotelSendsNames ?? []).includes(filters.hotelContacte)
      ) {
        return false;
      }

      if (
        filters.hotelRepondu &&
        !(offer.hotelResponses ?? []).some(
          (r) => r.hotelName === filters.hotelRepondu
        )
      ) {
        return false;
      }

      return true;
    });
  }, [data, filters]);

  const sortedOffers = useMemo(() => {
    const next = [...filteredOffers];
    next.sort((a, b) => {
      const aValue = getSortValue(a, sortConfig.key);
      const bValue = getSortValue(b, sortConfig.key);
      const directionFactor = sortConfig.direction === "asc" ? 1 : -1;

      if (aValue === bValue) return 0;
      if (aValue === null || aValue === undefined) return 1 * directionFactor;
      if (bValue === null || bValue === undefined) return -1 * directionFactor;
      if (typeof aValue === "number" && typeof bValue === "number") {
        return (aValue - bValue) * directionFactor;
      }
      return collator.compare(String(aValue), String(bValue)) * directionFactor;
    });
    return next;
  }, [filteredOffers, sortConfig]);

  const hotelOptions = useMemo(() => {
    const contactes = new Set<string>();
    const repondus = new Set<string>();
    for (const offer of data) {
      for (const name of offer.hotelSendsNames ?? []) {
        if (name) contactes.add(name);
      }
      for (const r of offer.hotelResponses ?? []) {
        if (r.hotelName) repondus.add(r.hotelName);
      }
    }
    const sort = (a: string, b: string) => collator.compare(a, b);
    return {
      contactes: Array.from(contactes).sort(sort),
      repondus: Array.from(repondus).sort(sort),
    };
  }, [data]);

  const handleFilterChange = (nextFilters: Partial<OfferFiltersState>) => {
    setFilters((previous) => ({ ...previous, ...nextFilters }));
  };

  const handleResetFilters = () => {
    setFilters({ ...INITIAL_FILTERS });
  };

  const handleSort = (key: SortKey) => {
    setSortConfig((current) => {
      if (current.key === key) {
        return {
          key,
          direction: current.direction === "asc" ? "desc" : "asc",
        };
      }
      return { key, direction: "asc" };
    });
  };

  const noResults = sortedOffers.length === 0;

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
            onClick={() => setShowImport((prev) => !prev)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          >
            {showImport ? "Masquer l'import" : "Importer (Excel)"}
          </button>
          <Link
            href="/offres/nouvelle"
            className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-brand-900 to-brand-700 px-4 py-2 text-sm font-medium text-white transition hover:from-brand-800 hover:to-brand-600"
          >
            <span aria-hidden className="text-base leading-none">+</span>
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
        />
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm sm:text-[15px]">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              {sortableColumns.map((column) => {
                const isActive = sortConfig.key === column.key;
                const ariaSort = isActive
                  ? sortConfig.direction === "asc"
                    ? "ascending"
                    : "descending"
                  : "none";

                return (
                  <th
                    key={column.key}
                    className={`px-4 py-3 font-medium ${column.className ?? ""}`}
                    aria-sort={ariaSort}
                  >
                    <button
                      type="button"
                      onClick={() => handleSort(column.key)}
                      className="flex items-center gap-1 text-slate-600 transition hover:text-slate-900"
                      >
                        <span>{column.label}</span>
                        <SortIndicator
                          active={isActive}
                          direction={sortConfig.direction}
                      />
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {sortedOffers.map((offer) => (
              <tr
                key={offer.id}
                onClick={() => handleNavigate(offer.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    handleNavigate(offer.id);
                  }
                }}
                tabIndex={0}
                role="button"
                className="cursor-pointer border-t border-slate-100 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
              >
                <td className="px-4 py-4 text-sm text-slate-500">
                  {offer.numeroOffre ?? "—"}
                </td>
                <td className="px-4 py-4">
                  <p className="font-medium text-slate-900">
                    {offer.societeContact}
                  </p>
                  <p className="text-xs text-slate-500">
                    {offer.transmisPar
                      ? `Transmis par ${offer.transmisPar}`
                      : "\u00A0"}
                  </p>
                </td>
                <td className="hidden px-4 py-4 text-sm text-slate-700 md:table-cell">
                  {offer.prenomContact || offer.nomContact ? (
                    <span>
                      {offer.titreContact ? `${offer.titreContact} ` : ""}
                      {[offer.prenomContact, offer.nomContact]
                        .filter(Boolean)
                        .join(" ")}
                    </span>
                  ) : (
                    "—"
                  )}
                  <p className="text-xs text-slate-500">
                    {offer.emailContact || "Contact inconnu"}
                  </p>
                </td>
                <td className="hidden px-4 py-4 text-sm text-slate-600 sm:table-cell">
                  {offer.pays}
                </td>
                <td className="hidden px-4 py-4 text-sm text-slate-600 lg:table-cell">
                  {offer.typeSejour ?? "—"}
                </td>
                <td className="hidden px-4 py-4 sm:table-cell">
                  {(() => {
                    const s = offer.statut ?? "brouillon";
                    const classes = STATUT_BADGE_STYLES[s] ?? STATUT_BADGE_STYLES.brouillon;
                    return (
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${classes}`}
                      >
                        {getStatutLabel(s)}
                      </span>
                    );
                  })()}
                </td>
                <td className="hidden px-4 py-4 text-sm text-slate-500 lg:table-cell">
                  {offer.createdAt
                    ? new Date(offer.createdAt).toLocaleDateString("fr-CH")
                    : "—"}
                </td>
                <td className="hidden px-4 py-4 text-center lg:table-cell">
                  {offer.relanceEffectueeLe ? (
                    <Tip label={`Relancée le ${new Date(offer.relanceEffectueeLe).toLocaleDateString("fr-CH")}`}>
                      <span className="text-emerald-600">✓</span>
                    </Tip>
                  ) : (
                    <span className="text-xs text-slate-300">—</span>
                  )}
                </td>
                <td className="hidden px-4 py-4 text-sm lg:table-cell">
                  {(offer.hotelSendsCount ?? 0) > 0 ? (
                    <Tip label={offer.hotelSendsNames?.join(", ") ?? ""}>
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                        {offer.hotelSendsCount}
                      </span>
                    </Tip>
                  ) : (
                    <span className="text-xs text-slate-300">—</span>
                  )}
                </td>
                <td className="hidden px-4 py-4 text-sm text-slate-700 lg:table-cell">
                  {(offer.hotelResponses?.length ?? 0) > 0 ? (
                    <Tip label={offer.hotelResponses!.map((r) => r.hotelName).join(", ")}>
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                        {offer.hotelResponses!.length}
                      </span>
                    </Tip>
                  ) : (
                    <span className="text-xs text-slate-300">—</span>
                  )}
                </td>
              </tr>
            ))}
            {noResults && (
              <tr>
                <td
                  colSpan={10}
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
    </section>
  );
}

function getSortValue(offer: Offer, key: SortKey) {
  switch (key) {
    case "numeroOffre":
      return offer.numeroOffre ?? "";
    case "societeContact":
      return normalize(offer.societeContact);
    case "contact":
      return normalize(
        [offer.titreContact, offer.prenomContact, offer.nomContact]
          .filter(Boolean)
          .join(" ") || offer.emailContact
      );
    case "pays":
      return offer.pays;
    case "typeSejour":
      return offer.typeSejour ?? "";
    case "statut":
      return getStatutLabel(offer.statut);
    case "createdAt":
      return offer.createdAt ?? "";
    case "relance":
      return offer.relanceEffectueeLe ?? "";
    case "hotelSendsCount":
      return offer.hotelSendsCount ?? 0;
    case "hotelResponsesCount":
      return offer.hotelResponses?.length ?? 0;
    default:
      return null;
  }
}

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

function Tip({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <span className="group relative inline-flex">
      {children}
      <span className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-800 px-2.5 py-1 text-xs text-white opacity-0 shadow-lg transition-opacity duration-100 group-hover:opacity-100">
        {label}
      </span>
    </span>
  );
}
