import type { DateOption, OfferStatut, ParsedHotelResponse } from "./types";

// ---------------------------------------------------------------------------
// Statut constants
// ---------------------------------------------------------------------------

export const OFFER_STATUTS: { value: OfferStatut; label: string }[] = [
  { value: "brouillon", label: "Brouillon" },
  { value: "envoye", label: "Envoy\u00e9" },
  { value: "refuse", label: "Refus\u00e9" },
  { value: "confirme", label: "Confirm\u00e9" },
];

export const STATUT_BADGE_STYLES: Record<OfferStatut, string> = {
  brouillon: "bg-slate-100 text-slate-700",
  envoye: "bg-blue-100 text-blue-700",
  refuse: "bg-rose-100 text-rose-700",
  confirme: "bg-emerald-100 text-emerald-700",
};

export function getStatutLabel(statut?: OfferStatut | string): string {
  const found = OFFER_STATUTS.find((s) => s.value === statut);
  return found?.label ?? "Brouillon";
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
 * Returns `null` if either date is missing or invalid.
 */
export function computeNights(du: string | null, au: string | null): number | null {
  if (!du || !au) return null;
  const start = new Date(du);
  const end = new Date(au);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
  const diffMs = end.getTime() - start.getTime();
  if (diffMs <= 0) return null;
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Parses a hotel response message that follows the template format from ShareOfferView.
 *
 * Expected format:
 *   Dates disponibles du 28 fév. 2026 au 2 mars 2026
 *   Chambres disponibles : 10 chambres simples / 15 doubles
 *   CHF 150 (€ 140) par nuit…
 *   Forfait séminaire : CHF 85 (€ 80)…
 *   Taxe de séjour : CHF 3.50 (€ 3.20)…
 *
 * Falls back gracefully: any field that cannot be parsed is left as null.
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

    // Dates disponibles du … au …
    const dateMatch = trimmed.match(
      /^Dates disponibles du (.+?) au (.+)$/i
    );
    if (dateMatch) {
      result.dateFrom = dateMatch[1].trim();
      result.dateTo = dateMatch[2].trim();
      continue;
    }

    // Chambres disponibles : 10 chambres simples / 15 doubles
    const roomsMatch = trimmed.match(
      /^Chambres disponibles\s*:\s*(\S+)\s+chambres?\s+simples?\s*\/\s*(\S+)\s+doubles?/i
    );
    if (roomsMatch) {
      result.roomsSimple = roomsMatch[1];
      result.roomsDouble = roomsMatch[2];
      continue;
    }

    // CHF 150 (€ 140) par nuit…
    const priceMatch = trimmed.match(
      /^CHF\s+([\d.,]+)\s*\(€\s*([\d.,]+)\)\s*par nuit/i
    );
    if (priceMatch) {
      result.priceChf = priceMatch[1];
      result.priceEur = priceMatch[2];
      continue;
    }

    // Forfait séminaire : CHF 85 (€ 80)…
    const forfaitMatch = trimmed.match(
      /^Forfait séminaire\s*:\s*CHF\s+([\d.,]+)\s*\(€\s*([\d.,]+)\)/i
    );
    if (forfaitMatch) {
      result.forfaitChf = forfaitMatch[1];
      result.forfaitEur = forfaitMatch[2];
      continue;
    }

    // Taxe de séjour : CHF 3.50 (€ 3.20)…
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
