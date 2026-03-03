import type { ParsedHotelResponse } from "@/features/offres/types";

// ---------------------------------------------------------------------------
// Hotel slug matching
// ---------------------------------------------------------------------------

const HOTEL_ALIAS_MAP: Record<string, string> = {
  // Villars hotels
  "royalp": "royalp",
  "royal plaza": "royalp",
  "chalet royalp": "royalp",
  "eurotel": "eurotel-victoria",
  "eurotel victoria": "eurotel-victoria",
  "bristol": "bristol",
  "hotel bristol": "bristol",
  "villars palace": "villars-palace",
  "palace": "villars-palace",
  "golf hotel": "golf-hotel",
  "ecureuil": "ecureuil",
  "l'écureuil": "ecureuil",
  "alpe fleurie": "alpe-fleurie",
  "renardière": "renardiere",
  "la renardière": "renardiere",
  // Diablerets hotels
  "les sources": "les-sources",
  "eurotel diablerets": "eurotel-diablerets",
  "eurotel les diablerets": "eurotel-diablerets",
  "victoria": "victoria",
  "mon abri": "mon-abri",
  "auberge de la poste": "auberge-poste",
  "diablerets": "hotel-diablerets",
  "hotel des diablerets": "hotel-diablerets",
  "les lilas": "les-lilas",
};

/**
 * Attempts to match a hotel name (from hotel response) to a known slug.
 */
export function matchHotelSlug(hotelName: string): string | null {
  const normalized = hotelName.toLowerCase().trim();

  // Exact match
  if (HOTEL_ALIAS_MAP[normalized]) return HOTEL_ALIAS_MAP[normalized];

  // Partial match — find the best candidate
  for (const [alias, slug] of Object.entries(HOTEL_ALIAS_MAP)) {
    if (normalized.includes(alias) || alias.includes(normalized)) {
      return slug;
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Image URL helper
// ---------------------------------------------------------------------------

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

/**
 * Build a public URL for a brochure image stored in Supabase Storage.
 * Path format: brochure-images/{destination}/{category}/{filename}
 */
export function brochureImageUrl(path: string): string {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `${SUPABASE_URL}/storage/v1/object/public/brochure-images/${path}`;
}

// ---------------------------------------------------------------------------
// Season detection
// ---------------------------------------------------------------------------

export type Season = "summer" | "winter";

/**
 * Detect season based on a date. Winter = Nov–Apr, Summer = May–Oct.
 */
export function detectSeason(dateStr?: string | null): Season {
  if (!dateStr) return "winter"; // default
  const month = new Date(dateStr).getMonth(); // 0-indexed
  return month >= 4 && month <= 9 ? "summer" : "winter";
}

// ---------------------------------------------------------------------------
// Section ID generator
// ---------------------------------------------------------------------------

export function sectionId(type: string, suffix?: string): string {
  return suffix ? `${type}-${suffix}` : type;
}

// ---------------------------------------------------------------------------
// Parse hotel response data for injection into brochure
// ---------------------------------------------------------------------------

export function extractHotelResponseData(parsed: ParsedHotelResponse) {
  return {
    priceChf: parsed.priceChf ?? undefined,
    priceEur: parsed.priceEur ?? undefined,
    forfaitChf: parsed.forfaitChf ?? undefined,
    forfaitEur: parsed.forfaitEur ?? undefined,
    roomsSimple: parsed.roomsSimple ?? undefined,
    roomsDouble: parsed.roomsDouble ?? undefined,
    dateFrom: parsed.dateFrom ?? undefined,
    dateTo: parsed.dateTo ?? undefined,
  };
}

// ---------------------------------------------------------------------------
// Destination labels
// ---------------------------------------------------------------------------

export const DESTINATIONS = [
  { value: "villars", label: "Villars-sur-Ollon" },
  { value: "diablerets", label: "Les Diablerets" },
] as const;

export type Destination = (typeof DESTINATIONS)[number]["value"];

export function destinationLabel(value: string): string {
  return DESTINATIONS.find((d) => d.value === value)?.label ?? value;
}
