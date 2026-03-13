export type ProvenanceItem = {
  label: string;
  count: number;
  percentage: number;
};

export type MonthlyDistributionItem = {
  monthIndex: number;
  label: string;
  count: number;
  percentage: number;
};

export type SeasonSplit = {
  eteCount: number;
  hiverCount: number;
  shoulderCount: number;
  etePercentage: number;
  hiverPercentage: number;
  shoulderPercentage: number;
  totalConsidered: number;
};

export type ConfirmedSplit = {
  hebergement: number;
  activite: number;
};

export type OfferStats = {
  totalOffers: number;
  offersWithSendDate: number;
  provenance: ProvenanceItem[];
  transmitters: ProvenanceItem[];
  typeBreakdown: ProvenanceItem[];
  confirmedSplit: ConfirmedSplit;
  totalHotelResponses: number;
  averageStayLength: number | null;
  averageGroupSize: number | null;
  stayMonthDistribution: MonthlyDistributionItem[];
  monthlyDistribution: MonthlyDistributionItem[];
  seasonSplit: SeasonSplit;
};

export type AnalyzableField = {
  key: string;
  label: string;
  accessor: (offer: import("@/features/offres/types").Offer) => string;
};

export type FieldYearDistribution = {
  year: number;
  total: number;
  values: { label: string; count: number; percentage: number }[];
};
