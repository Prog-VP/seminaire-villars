// ---------------------------------------------------------------------------
// Section types
// ---------------------------------------------------------------------------

export type BrochureSectionType =
  | "welcome"
  | "hotel"
  | "venue"
  | "activities-summer"
  | "activities-winter"
  | "ski"
  | "contacts"
  | "custom";

export type ConferenceRoom = {
  name: string;
  m2: string;
  height: string;
  theatre: number;
  seminar: number;
  uShape: number;
  banquet: number;
};

export type Activity = {
  name: string;
  description: string;
  price: string;
  image?: string;
};

export type SkiPrice = {
  period: string;
  skipass: string;
  rental: string;
};

export type ConferencePackage = {
  includes: string[];
  priceDay?: string;
  priceHalfDay?: string;
};

export type BrochureSectionMetadata = {
  hotelSlug?: string;
  category?: string;
  conferencePackage?: ConferencePackage;
  conferenceRooms?: ConferenceRoom[];
  activities?: Activity[];
  skiPrices?: SkiPrice[];
  // Dynamic data injected from hotel responses
  hotelResponseData?: {
    priceChf?: string;
    priceEur?: string;
    forfaitChf?: string;
    forfaitEur?: string;
    roomsSimple?: string;
    roomsDouble?: string;
    dateFrom?: string;
    dateTo?: string;
  };
};

export type BrochureSection = {
  id: string;
  type: BrochureSectionType;
  enabled: boolean;
  title: string;
  content: string;
  images: string[];
  metadata?: BrochureSectionMetadata;
};

// ---------------------------------------------------------------------------
// DB models
// ---------------------------------------------------------------------------

export type BrochureTemplate = {
  id: string;
  destination: string;
  lang: string;
  sections: BrochureSection[];
  createdAt?: string;
  updatedAt?: string;
};

export type OfferBrochure = {
  id: string;
  offerId: string;
  destination: string;
  lang: string;
  sections: BrochureSection[];
  createdAt?: string;
  updatedAt?: string;
};

// ---------------------------------------------------------------------------
// Public RPC result
// ---------------------------------------------------------------------------

export type PublicBrochureData = {
  id: string;
  numeroOffre?: string | null;
  societeContact: string;
  stationDemandee?: string | null;
  langue?: string | null;
  brochure: {
    id: string;
    destination: string;
    lang: string;
    sections: BrochureSection[];
    updatedAt?: string;
  } | null;
};
