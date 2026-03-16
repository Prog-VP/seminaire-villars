/* ── Shared types & constants for statistiques ── */

export const DIM_LABELS = {
  statut: "Statut",
  pays: "Pays",
  typeSociete: "Type de société",
  typeSejour: "Type de séjour",
  stationDemandee: "Station",
  traitePar: "Traité par",
  transmisPar: "Transmis par",
  activitesDemandees: "Activités",
  activiteUniquement: "Activité uniquement",
  seminaire: "Séminaire",
} as const;

export type Dimension = keyof typeof DIM_LABELS;
export const DIMENSIONS = Object.keys(DIM_LABELS) as Dimension[];

export type Filters = Partial<Record<Dimension, string>>;
export type YearPin = { dim: Dimension; year: number } | null;
export type MonthFilters = { envoi?: number; sejour?: number };
export type YearFilters = Set<number>; // empty = all years shown

export type EvoDimData = {
  years: number[];
  rows: { label: string; yearCounts: Record<number, number>; total: number }[];
  yearTotals: Record<number, number>;
};

export type MonthlyData = {
  years: number[];
  months: { month: number; yearCounts: Record<number, number>; total: number }[];
};

export type HotelRow = {
  name: string;
  contacted: Record<number, number>;
  responded: Record<number, number>;
  totalContacted: number;
  totalResponded: number;
};

export const DIM_CONFIG: { dim: Dimension; limit?: number }[] = [
  { dim: "statut" },
  { dim: "pays", limit: 15 },
  { dim: "typeSociete" },
  { dim: "typeSejour" },
  { dim: "stationDemandee" },
  { dim: "traitePar" },
  { dim: "transmisPar" },
  { dim: "activitesDemandees" },
  { dim: "activiteUniquement" },
  { dim: "seminaire" },
];

export const MONTH_NAMES = [
  "Jan", "Fév", "Mar", "Avr", "Mai", "Juin",
  "Juil", "Août", "Sep", "Oct", "Nov", "Déc",
];

export const PAGE_SIZE = 25;
