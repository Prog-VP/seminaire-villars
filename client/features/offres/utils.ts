import type { DateOption, ParsedHotelResponse } from "./types";

// ---------------------------------------------------------------------------
// Statut constants
// ---------------------------------------------------------------------------

/** Default statuts used as fallback when settings haven't loaded yet. */
export const DEFAULT_STATUTS = ["Brouillon", "Envoyé", "Refusé", "Confirmé"];

/**
 * Legacy key → label mapping for migrating old data.
 * Old offers may still have coded keys; this converts them to display labels.
 */
const LEGACY_STATUT_MAP: Record<string, string> = {
  brouillon: "Brouillon",
  envoye: "Envoyé",
  refuse: "Refusé",
  confirme: "Confirmé",
};

/**
 * Normalizes a statut value — converts legacy keys to labels.
 */
export function normalizeStatut(statut?: string | null): string {
  if (!statut) return DEFAULT_STATUTS[0];
  return LEGACY_STATUT_MAP[statut] ?? statut;
}

/**
 * Rotating palette of badge styles for statuts (fallback when no color is set).
 */
const BADGE_PALETTE = [
  "bg-slate-100 text-slate-700",
  "bg-blue-100 text-blue-700",
  "bg-rose-100 text-rose-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-purple-100 text-purple-700",
  "bg-cyan-100 text-cyan-700",
  "bg-pink-100 text-pink-700",
];

const COLOR_TO_BADGE: Record<string, string> = {
  slate: "bg-slate-100 text-slate-700",
  blue: "bg-blue-100 text-blue-700",
  rose: "bg-rose-100 text-rose-700",
  emerald: "bg-emerald-100 text-emerald-700",
  amber: "bg-amber-100 text-amber-700",
  purple: "bg-purple-100 text-purple-700",
  cyan: "bg-cyan-100 text-cyan-700",
  pink: "bg-pink-100 text-pink-700",
};

export function getStatutBadgeStyle(statut: string, allStatuts: string[], colorMap?: Record<string, string | null>): string {
  if (colorMap) {
    const color = colorMap[statut];
    if (color && COLOR_TO_BADGE[color]) return COLOR_TO_BADGE[color];
    // If colorMap exists but no color set for this statut → default grey
    if (statut in colorMap) return BADGE_PALETTE[0];
  }
  return BADGE_PALETTE[0];
}

/**
 * Converts hotel category values like "3*" into star characters "★★★".
 * Non-star values are returned as-is.
 */
export function formatStars(value: string): string {
  const match = value.match(/^(\d+)\*$/);
  if (!match) return value;
  return "★".repeat(Number(match[1]));
}

/**
 * Returns the effective stay dates for an offer:
 * 1. Confirmed date if set
 * 2. First date option if available
 */
export function getEffectiveDates(offer: {
  dateOptions?: DateOption[];
  dateConfirmeeDu?: string | null;
  dateConfirmeeAu?: string | null;
}): { du: string | null; au: string | null } {
  if (offer.dateConfirmeeDu || offer.dateConfirmeeAu) {
    return { du: offer.dateConfirmeeDu ?? null, au: offer.dateConfirmeeAu ?? null };
  }
  if (offer.dateOptions?.length) {
    return { du: offer.dateOptions[0].du || null, au: offer.dateOptions[0].au || null };
  }
  return { du: null, au: null };
}

/**
 * Computes the number of nights between two ISO date strings.
 * Returns `null` if either date is missing, invalid, or approximatif.
 */
export function computeNights(du: string | null, au: string | null, approximatif?: boolean): number | null {
  if (approximatif) return null;
  if (!du || !au) return null;
  const start = new Date(du);
  const end = new Date(au);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
  const diffMs = end.getTime() - start.getTime();
  if (diffMs <= 0) return null;
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Formats an approximate date option as a readable month/year string.
 * E.g. "2025-01-01" → "Janvier 2025"
 */
const MONTH_NAMES_FR = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

export function formatApproxDate(isoDate: string): string {
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return isoDate;
  return `${MONTH_NAMES_FR[d.getMonth()]} ${d.getFullYear()}`;
}

/**
 * Parses a hotel response message that follows the template format from ShareOfferView.
 */
export function parseHotelResponseMessage(message: string): ParsedHotelResponse {
  const result: ParsedHotelResponse = {
    dateFrom: null,
    dateTo: null,
    roomsSimple: null,
    roomsDouble: null,
    priceChf: null,
    priceEur: null,
    forfaitChf: null,
    forfaitEur: null,
    taxeChf: null,
    taxeEur: null,
    raw: message,
  };

  const lines = message.split("\n");

  for (const line of lines) {
    const trimmed = line.trim();

    const dateMatch = trimmed.match(/^Dates disponibles du (.+?) au (.+)$/i);
    if (dateMatch) {
      result.dateFrom = dateMatch[1].trim();
      result.dateTo = dateMatch[2].trim();
      continue;
    }

    const roomsMatch = trimmed.match(
      /^Chambres disponibles\s*:\s*(\S+)\s+chambres?\s+simples?\s*\/\s*(\S+)\s+doubles?/i
    );
    if (roomsMatch) {
      result.roomsSimple = roomsMatch[1];
      result.roomsDouble = roomsMatch[2];
      continue;
    }

    const priceMatch = trimmed.match(/^CHF\s+([\d.,]+)\s*\(€\s*([\d.,]+)\)\s*par nuit/i);
    if (priceMatch) {
      result.priceChf = priceMatch[1];
      result.priceEur = priceMatch[2];
      continue;
    }

    const forfaitMatch = trimmed.match(
      /^Forfait séminaire\s*:\s*CHF\s+([\d.,]+)\s*\(€\s*([\d.,]+)\)/i
    );
    if (forfaitMatch) {
      result.forfaitChf = forfaitMatch[1];
      result.forfaitEur = forfaitMatch[2];
      continue;
    }

    const taxeMatch = trimmed.match(
      /^Taxe de séjour\s*:\s*CHF\s+([\d.,]+)\s*\(€\s*([\d.,]+)\)/i
    );
    if (taxeMatch) {
      result.taxeChf = taxeMatch[1];
      result.taxeEur = taxeMatch[2];
      continue;
    }
  }

  return result;
}
