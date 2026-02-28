"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Offer } from "../types";
import { OfferFilters } from "./OfferFilters";

type BooleanFilterValue = "all" | "true" | "false";

export type OfferFiltersState = {
  societe: string;
  contact: string;
  email: string;
  typeSociete: Offer["typeSociete"] | "all";
  pays: Offer["pays"] | "all";
  typeSejour: Offer["typeSejour"] | "all";
  stationDemandee: Offer["stationDemandee"] | "all";
  categorieHotel: Offer["categorieHotel"] | "all";
  traitePar: Offer["traitePar"] | "all";
  transmisPar: string;
  paxMin: string;
  paxMax: string;
  dateFrom: string;
  dateTo: string;
  activitesVillarsDiablerets: BooleanFilterValue;
  reservationEffectuee: BooleanFilterValue;
  contactEntreDansBrevo: BooleanFilterValue;
  autres: string;
};

type SortKey =
  | "societeContact"
  | "contact"
  | "pays"
  | "typeSejour"
  | "dateEnvoiOffre";

type SortConfig = {
  key: SortKey;
  direction: "asc" | "desc";
};

type OfferTableProps = {
  data: Offer[];
  errorMessage?: string | null;
};

type PipelineTab = "pending" | "running" | "relancees";

const PIPELINE_BADGE: Record<PipelineTab, { label: string; classes: string }> = {
  pending: { label: "À envoyer", classes: "bg-brand-100 text-brand-800" },
  running: { label: "En cours", classes: "bg-brand-500/15 text-brand-700" },
  relancees: { label: "Relancée", classes: "bg-brand-900/10 text-brand-900" },
};

const dateFormatter = new Intl.DateTimeFormat("fr-CH", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const collator = new Intl.Collator("fr", {
  sensitivity: "base",
  usage: "sort",
  numeric: true,
});

const INITIAL_FILTERS: OfferFiltersState = {
  societe: "",
  contact: "",
  email: "",
  typeSociete: "all",
  pays: "all",
  typeSejour: "all",
  stationDemandee: "all",
  categorieHotel: "all",
  traitePar: "all",
  transmisPar: "",
  paxMin: "",
  paxMax: "",
  dateFrom: "",
  dateTo: "",
  activitesVillarsDiablerets: "all",
  reservationEffectuee: "all",
  contactEntreDansBrevo: "all",
  autres: "",
};

const sortableColumns: { label: string; key: SortKey; className?: string }[] = [
  { label: "Société", key: "societeContact" },
  { label: "Contact", key: "contact", className: "hidden md:table-cell" },
  { label: "Pays", key: "pays", className: "hidden sm:table-cell" },
  { label: "Type séjour", key: "typeSejour", className: "hidden lg:table-cell" },
  { label: "Envoyée le", key: "dateEnvoiOffre", className: "hidden sm:table-cell" },
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
  const [filters, setFilters] = useState<OfferFiltersState>({
    ...INITIAL_FILTERS,
  });
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "dateEnvoiOffre",
    direction: "desc",
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
    const dateFrom = filters.dateFrom || null;
    const dateTo = filters.dateTo || null;

    return data.filter((offer) => {
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

      const offerDate = offer.dateEnvoiOffre?.slice(0, 10) ?? null;
      if (dateFrom && (!offerDate || offerDate < dateFrom)) {
        return false;
      }

      if (dateTo && (!offerDate || offerDate > dateTo)) {
        return false;
      }

      if (
        !matchesBoolean(
          filters.activitesVillarsDiablerets,
          offer.activitesVillarsDiablerets
        )
      ) {
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
        <div className="ml-auto">
          <Link
            href="/offres/nouvelle"
            className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-brand-900 to-brand-700 px-4 py-2 text-sm font-medium text-white transition hover:from-brand-800 hover:to-brand-600"
          >
            <span aria-hidden className="text-base leading-none">+</span>
            Créer une offre
          </Link>
        </div>
      </header>

      <div className="mb-6">
        <OfferFilters
          filters={filters}
          onChange={handleFilterChange}
          onReset={handleResetFilters}
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
              <th className="hidden px-4 py-3 font-medium text-slate-600 sm:table-cell">
                Statut
              </th>
              <th className="hidden px-4 py-3 font-medium text-slate-600 lg:table-cell">
                Réponses hôtels
              </th>
              <th className="hidden px-4 py-3 text-center font-medium text-slate-600 lg:table-cell">
                Annexes
              </th>
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
                <td className="hidden px-4 py-4 text-sm text-slate-600 sm:table-cell">
                  {offer.dateEnvoiOffre
                    ? dateFormatter.format(new Date(offer.dateEnvoiOffre))
                    : "Non envoyée"}
                </td>
                <td className="hidden px-4 py-4 sm:table-cell">
                  {(() => {
                    const tab = getPipelineTab(offer);
                    const badge = PIPELINE_BADGE[tab];
                    return (
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.classes}`}
                      >
                        {badge.label}
                      </span>
                    );
                  })()}
                </td>
                <td className="hidden px-4 py-4 text-sm text-slate-700 lg:table-cell">
                  <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                    {offer.hotelResponses?.length ?? 0}
                  </span>
                </td>
                <td className="hidden px-4 py-4 text-center text-sm text-slate-600 lg:table-cell">
                  {offer.attachmentsCount && offer.attachmentsCount > 0 ? (
                    <span
                      aria-label="Annexes disponibles"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-base"
                      title={`${offer.attachmentsCount} annexe${offer.attachmentsCount > 1 ? "s" : ""}`}
                    >
                      📎
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400">—</span>
                  )}
                </td>
              </tr>
            ))}
            {noResults && (
              <tr>
                <td
                  colSpan={8}
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
    case "dateEnvoiOffre":
      return offer.dateEnvoiOffre
        ? new Date(offer.dateEnvoiOffre).getTime()
        : null;
    default:
      return null;
  }
}

function getPipelineTab(offer: Offer): PipelineTab {
  if (!offer.dateEnvoiOffre) {
    return "pending";
  }

  if (offer.relanceEffectueeLe) {
    return "relancees";
  }

  return "running";
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
