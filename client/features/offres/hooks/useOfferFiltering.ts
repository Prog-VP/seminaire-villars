import { useCallback, useEffect, useMemo, useState } from "react";
import type { Offer } from "../types";
import { normalizeStatut } from "../utils";

const STORAGE_KEY = "offer-filters";
const SORT_STORAGE_KEY = "offer-sort";

export type BooleanFilterValue = "all" | "true" | "false";

export type OfferFiltersState = {
  numeroOffre: string;
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
  langue: string;
  transmisPar: string;
  paxMin: string;
  paxMax: string;
  activiteUniquement: BooleanFilterValue;
  activitesDemandees: BooleanFilterValue;
  seminaire: BooleanFilterValue;
  reservationEffectuee: BooleanFilterValue;
  retourEffectueHotels: BooleanFilterValue;
  contactEntreDansBrevo: BooleanFilterValue;
  hotelContacte: string;
  hotelRepondu: string;
  sejourDu: string;
  sejourAu: string;
  anneeOffre: string;
  dateEnvoiDu: string;
  dateEnvoiAu: string;
  relanceDu: string;
  relanceAu: string;
  notes: string;
};

export type SortKey =
  | "numeroOffre"
  | "societeContact"
  | "contact"
  | "pays"
  | "typeSejour"
  | "statut"
  | "createdAt"
  | "relance"
  | "hotelSendsCount"
  | "hotelResponsesCount"
  | "commentsCount";

export type SortConfig = {
  key: SortKey;
  direction: "asc" | "desc";
};

export const INITIAL_FILTERS: OfferFiltersState = {
  numeroOffre: "",
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
  langue: "all",
  transmisPar: "",
  paxMin: "",
  paxMax: "",
  activiteUniquement: "all",
  activitesDemandees: "all",
  seminaire: "all",
  reservationEffectuee: "all",
  retourEffectueHotels: "all",
  contactEntreDansBrevo: "all",
  hotelContacte: "",
  hotelRepondu: "",
  sejourDu: "",
  sejourAu: "",
  anneeOffre: "all",
  dateEnvoiDu: "",
  dateEnvoiAu: "",
  relanceDu: "",
  relanceAu: "",
  notes: "",
};

export const sortableColumns: { label: string; key: SortKey; className?: string }[] = [
  { label: "N°", key: "numeroOffre" },
  { label: "Société", key: "societeContact" },
  { label: "Contact", key: "contact", className: "hidden md:table-cell" },
  { label: "Pays", key: "pays", className: "hidden sm:table-cell" },
  { label: "Séjour", key: "typeSejour", className: "hidden lg:table-cell" },
  { label: "Statut", key: "statut", className: "hidden sm:table-cell" },
  { label: "Envoi", key: "createdAt", className: "hidden lg:table-cell" },
  { label: "Rel.", key: "relance", className: "hidden lg:table-cell" },
  { label: "Hôtels", key: "hotelSendsCount", className: "hidden lg:table-cell" },
  { label: "Rép.", key: "hotelResponsesCount", className: "hidden lg:table-cell" },
  { label: "Notes", key: "commentsCount", className: "hidden lg:table-cell" },
];

const collator = new Intl.Collator("fr", {
  sensitivity: "base",
  usage: "sort",
  numeric: true,
});

function normalize(value?: string | null) {
  return value
    ? value.toString().toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "")
    : "";
}

function getContactField(offer: Offer) {
  return normalize(
    [offer.titreContact, offer.prenomContact, offer.nomContact].filter(Boolean).join(" ")
  );
}

function matchesText(filter: string, value?: string | null) {
  return !filter || normalize(value).includes(filter);
}

function matchesExact(filter: string, value?: string | null) {
  if (filter === "all") return true;
  // Support comma-separated multi-values
  if (filter.includes(",")) {
    const set = new Set(filter.split(","));
    return value != null && set.has(value);
  }
  return value === filter;
}

/** For multi-value offer fields (station, categorie) — any selected filter must overlap */
function matchesMultiField(filter: string, offerValue?: string | null) {
  if (filter === "all") return true;
  const filterSet = new Set(filter.split(","));
  const offerValues = (offerValue ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  return offerValues.some((v) => filterSet.has(v));
}

function matchesBoolean(filter: BooleanFilterValue, actual?: boolean | null) {
  if (filter === "all") return true;
  return filter === "true" ? actual === true : actual === false;
}

function matchesOffer(offer: Offer, filters: OfferFiltersState): boolean {
  const norm = {
    numeroOffre: normalize(filters.numeroOffre),
    societe: normalize(filters.societe),
    contact: normalize(filters.contact),
    email: normalize(filters.email),
    transmisPar: normalize(filters.transmisPar),
    notes: normalize(filters.notes),
  };

  if (!matchesText(norm.numeroOffre, offer.numeroOffre)) return false;
  if (!matchesText(norm.societe, offer.societeContact)) return false;
  if (norm.contact && !getContactField(offer).includes(norm.contact)) return false;
  if (!matchesText(norm.email, offer.emailContact)) return false;
  if (!matchesText(norm.transmisPar, offer.transmisPar)) return false;

  if (norm.notes) {
    const commentsText = (offer.comments ?? []).map((c) => normalize(c.content)).join(" ");
    if (!commentsText.includes(norm.notes)) return false;
  }

  if (!matchesExact(filters.statut, normalizeStatut(offer.statut))) return false;
  if (!matchesExact(filters.typeSociete as string, offer.typeSociete)) return false;
  if (!matchesExact(filters.pays as string, offer.pays)) return false;
  if (!matchesExact(filters.typeSejour as string, offer.typeSejour)) return false;
  if (!matchesMultiField(filters.stationDemandee as string, offer.stationDemandee)) return false;
  if (!matchesExact(filters.traitePar as string, offer.traitePar)) return false;
  if (!matchesExact(filters.langue, offer.langue)) return false;
  if (!matchesMultiField(filters.categorieHotel as string, offer.categorieHotel)) return false;

  const paxMin = filters.paxMin ? Number(filters.paxMin) : null;
  const paxMax = filters.paxMax ? Number(filters.paxMax) : null;
  const pax = typeof offer.nombrePax === "number" ? offer.nombrePax : null;
  if (paxMin !== null && (pax === null || pax < paxMin)) return false;
  if (paxMax !== null && (pax === null || pax > paxMax)) return false;

  if (!matchesBoolean(filters.activiteUniquement, offer.activiteUniquement)) return false;
  if (!matchesBoolean(filters.activitesDemandees, offer.activitesDemandees)) return false;
  if (!matchesBoolean(filters.seminaire, offer.seminaire)) return false;
  if (!matchesBoolean(filters.reservationEffectuee, offer.reservationEffectuee)) return false;
  if (!matchesBoolean(filters.retourEffectueHotels, offer.retourEffectueHotels)) return false;
  if (!matchesBoolean(filters.contactEntreDansBrevo, offer.contactEntreDansBrevo)) return false;

  // Année offre (basée sur dateEnvoiOffre)
  if (filters.anneeOffre !== "all") {
    const year = offer.dateEnvoiOffre?.slice(0, 4) ?? "";
    if (year !== filters.anneeOffre) return false;
  }

  // Date d'envoi range
  if (filters.dateEnvoiDu && (!offer.dateEnvoiOffre || offer.dateEnvoiOffre < filters.dateEnvoiDu)) return false;
  if (filters.dateEnvoiAu && (!offer.dateEnvoiOffre || offer.dateEnvoiOffre > filters.dateEnvoiAu)) return false;

  // Relance range
  if (filters.relanceDu && (!offer.relanceEffectueeLe || offer.relanceEffectueeLe < filters.relanceDu)) return false;
  if (filters.relanceAu && (!offer.relanceEffectueeLe || offer.relanceEffectueeLe > filters.relanceAu)) return false;

  if (filters.hotelContacte && !(offer.hotelSendsNames ?? []).includes(filters.hotelContacte)) return false;
  if (filters.hotelRepondu && !(offer.hotelResponses ?? []).some((r) => r.hotelName === filters.hotelRepondu)) return false;

  if (filters.sejourDu || filters.sejourAu) {
    const opts = offer.dateOptions ?? [];
    if (opts.length === 0) return false;
    const matches = opts.some((o) => {
      const du = o.du || null;
      const au = o.au || du;
      if (!du) return false;
      if (filters.sejourAu && du > filters.sejourAu) return false;
      if (filters.sejourDu && (au ?? du) < filters.sejourDu) return false;
      return true;
    });
    if (!matches) return false;
  }

  return true;
}

function getSortValue(offer: Offer, key: SortKey) {
  switch (key) {
    case "numeroOffre": return offer.numeroOffre ?? "";
    case "societeContact": return normalize(offer.societeContact);
    case "contact": return normalize(
      [offer.titreContact, offer.prenomContact, offer.nomContact].filter(Boolean).join(" ") || offer.emailContact
    );
    case "pays": return offer.pays;
    case "typeSejour": return offer.typeSejour ?? "";
    case "statut": return normalizeStatut(offer.statut);
    case "createdAt": return offer.dateEnvoiOffre ?? "";
    case "relance": return offer.relanceEffectueeLe ?? "";
    case "hotelSendsCount": return offer.hotelSendsCount ?? 0;
    case "hotelResponsesCount": return offer.hotelResponses?.length ?? 0;
    case "commentsCount": return offer.comments?.length ?? 0;
    default: return null;
  }
}

function loadFilters(): OfferFiltersState {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) return { ...INITIAL_FILTERS, ...JSON.parse(raw) };
  } catch {}
  return { ...INITIAL_FILTERS };
}

function loadSort(): SortConfig {
  try {
    const raw = sessionStorage.getItem(SORT_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { key: "societeContact", direction: "asc" };
}

export function useOfferFiltering(data: Offer[]) {
  const [filters, setFilters] = useState<OfferFiltersState>(loadFilters);
  const [sortConfig, setSortConfig] = useState<SortConfig>(loadSort);

  useEffect(() => {
    const isDefault = JSON.stringify(filters) === JSON.stringify(INITIAL_FILTERS);
    if (isDefault) sessionStorage.removeItem(STORAGE_KEY);
    else sessionStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
  }, [filters]);

  useEffect(() => {
    sessionStorage.setItem(SORT_STORAGE_KEY, JSON.stringify(sortConfig));
  }, [sortConfig]);

  const filteredOffers = useMemo(
    () => data.filter((offer) => matchesOffer(offer, filters)),
    [data, filters]
  );

  const sortedOffers = useMemo(() => {
    const sorted = [...filteredOffers];
    const dir = sortConfig.direction === "asc" ? 1 : -1;
    sorted.sort((a, b) => {
      const av = getSortValue(a, sortConfig.key);
      const bv = getSortValue(b, sortConfig.key);
      if (av === bv) return 0;
      if (av === null || av === undefined) return dir;
      if (bv === null || bv === undefined) return -dir;
      if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;
      return collator.compare(String(av), String(bv)) * dir;
    });
    return sorted;
  }, [filteredOffers, sortConfig]);

  const hotelOptions = useMemo(() => {
    const contactes = new Set<string>();
    const repondus = new Set<string>();
    for (const offer of data) {
      for (const name of offer.hotelSendsNames ?? []) if (name) contactes.add(name);
      for (const r of offer.hotelResponses ?? []) if (r.hotelName) repondus.add(r.hotelName);
    }
    const sort = (a: string, b: string) => collator.compare(a, b);
    return { contactes: Array.from(contactes).sort(sort), repondus: Array.from(repondus).sort(sort) };
  }, [data]);

  const anneeOptions = useMemo(() => {
    const years = new Set<string>();
    for (const offer of data) {
      const y = offer.dateEnvoiOffre?.slice(0, 4);
      if (y) years.add(y);
    }
    return Array.from(years).sort().reverse();
  }, [data]);

  const handleFilterChange = (next: Partial<OfferFiltersState>) => {
    setFilters((prev) => ({ ...prev, ...next }));
  };

  const handleResetFilters = useCallback(() => setFilters({ ...INITIAL_FILTERS }), []);

  const handleSort = (key: SortKey) => {
    setSortConfig((cur) =>
      cur.key === key
        ? { key, direction: cur.direction === "asc" ? "desc" : "asc" }
        : { key, direction: "asc" }
    );
  };

  const hasActiveFilters = JSON.stringify(filters) !== JSON.stringify(INITIAL_FILTERS);

  return { filters, sortConfig, handleSort, sortedOffers, handleFilterChange, handleResetFilters, hotelOptions, anneeOptions, hasActiveFilters };
}
