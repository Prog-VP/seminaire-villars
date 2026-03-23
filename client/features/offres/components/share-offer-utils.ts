import type { Lang } from "../i18n";
import { t, formatDateLocale } from "../i18n";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DateOptionResponse = {
  disponible: boolean;
  dateFrom: string;
  dateTo: string;
  roomsSimple: string;
  roomsDouble: string;
  priceSimpleChf: string;
  priceDoubleChf: string;
  demiPensionChf: string;
  pensionCompleteChf: string;
  forfaitJourneeChf: string;
  forfaitDemiJourneeChf: string;
  taxeChf: string;
  commentaire: string;
};

export type TemplateState = {
  dateResponses: DateOptionResponse[];
  commentaireGeneral: string;
};

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

export function createDateOptionResponse(
  du: string,
  au: string,
  prefill?: { roomsSimple?: string; roomsDouble?: string },
): DateOptionResponse {
  return {
    disponible: true,
    dateFrom: du,
    dateTo: au,
    roomsSimple: prefill?.roomsSimple ?? "",
    roomsDouble: prefill?.roomsDouble ?? "",
    priceSimpleChf: "",
    priceDoubleChf: "",
    demiPensionChf: "",
    pensionCompleteChf: "",
    forfaitJourneeChf: "",
    forfaitDemiJourneeChf: "",
    taxeChf: "",
    commentaire: "",
  };
}

export function createTemplateDefaults(
  dateOptions: { du: string; au: string }[] | undefined,
  confirmeeDu?: string | null,
  confirmeeAu?: string | null,
  prefill?: { chambresSimple?: number | null; chambresDouble?: number | null },
): TemplateState {
  const options = dateOptions?.length
    ? dateOptions
    : confirmeeDu || confirmeeAu
      ? [{ du: confirmeeDu || "", au: confirmeeAu || "" }]
      : [{ du: "", au: "" }];

  const rooms = {
    roomsSimple: prefill?.chambresSimple ? String(prefill.chambresSimple) : "",
    roomsDouble: prefill?.chambresDouble ? String(prefill.chambresDouble) : "",
  };

  return {
    dateResponses: options.map((o) => createDateOptionResponse(o.du || "", o.au || "", rooms)),
    commentaireGeneral: "",
  };
}

// ---------------------------------------------------------------------------
// CSS
// ---------------------------------------------------------------------------

export const inputClass =
  "mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200";

// ---------------------------------------------------------------------------
// EUR conversion
// ---------------------------------------------------------------------------

export function chfToEur(chf: string, rate: number): string {
  const n = parseFloat(chf.replace(",", "."));
  if (isNaN(n) || n === 0) return "";
  return (n * rate).toFixed(2);
}

// ---------------------------------------------------------------------------
// Build message
// ---------------------------------------------------------------------------

export function buildTemplateMessage(state: TemplateState, lang: Lang, rate: number, opts: {
  showSimple: boolean;
  showDouble: boolean;
  showSeminaire: boolean;
  showJournee: boolean;
  showDemiJournee: boolean;
  activiteUniquement: boolean;
}): string {
  const allClosed = state.dateResponses.every((d) => !d.disponible);
  if (allClosed) {
    return t(lang, "noAvailability");
  }

  const lines: string[] = [];

  for (let i = 0; i < state.dateResponses.length; i++) {
    const dr = state.dateResponses[i];
    const label = state.dateResponses.length > 1
      ? `--- ${t(lang, "dateOption")} ${i + 1} ---`
      : null;

    if (label) lines.push(label);

    if (!dr.disponible) {
      lines.push(t(lang, "closed"));
      lines.push("");
      continue;
    }

    const arrival = formatDateLocale(dr.dateFrom, lang);
    const departure = formatDateLocale(dr.dateTo, lang);
    lines.push(`${t(lang, "availableDates")}: ${arrival} → ${departure}`);

    if (!opts.activiteUniquement) {
      if (opts.showSimple && dr.roomsSimple) {
        lines.push(`${t(lang, "availableRoomsSimple")}: ${dr.roomsSimple}`);
      }
      if (opts.showDouble && dr.roomsDouble) {
        lines.push(`${t(lang, "availableRoomsDouble")}: ${dr.roomsDouble}`);
      }
      if (opts.showSimple && dr.priceSimpleChf) {
        const eur = chfToEur(dr.priceSimpleChf, rate);
        lines.push(`${t(lang, "priceSingleChf")}: CHF ${dr.priceSimpleChf}${eur ? ` (≈ €${eur})` : ""}`);
      }
      if (opts.showDouble && dr.priceDoubleChf) {
        const eur = chfToEur(dr.priceDoubleChf, rate);
        lines.push(`${t(lang, "priceDoubleChf")}: CHF ${dr.priceDoubleChf}${eur ? ` (≈ €${eur})` : ""}`);
      }
      if (dr.demiPensionChf) {
        const eur = chfToEur(dr.demiPensionChf, rate);
        lines.push(`${t(lang, "halfBoardChf")}: CHF ${dr.demiPensionChf}${eur ? ` (≈ €${eur})` : ""}`);
      }
      if (dr.pensionCompleteChf) {
        const eur = chfToEur(dr.pensionCompleteChf, rate);
        lines.push(`${t(lang, "fullBoardChf")}: CHF ${dr.pensionCompleteChf}${eur ? ` (≈ €${eur})` : ""}`);
      }
    }

    if (opts.showSeminaire) {
      if (opts.showJournee && dr.forfaitJourneeChf) {
        const eur = chfToEur(dr.forfaitJourneeChf, rate);
        const lbl = opts.showDemiJournee ? t(lang, "seminarPackageFullDayChf") : t(lang, "seminarPackageChf");
        lines.push(`${lbl}: CHF ${dr.forfaitJourneeChf}${eur ? ` (≈ €${eur})` : ""}`);
      }
      if (opts.showDemiJournee && dr.forfaitDemiJourneeChf) {
        const eur = chfToEur(dr.forfaitDemiJourneeChf, rate);
        const lbl = opts.showJournee ? t(lang, "seminarPackageHalfDayChf") : t(lang, "seminarPackageChf");
        lines.push(`${lbl}: CHF ${dr.forfaitDemiJourneeChf}${eur ? ` (≈ €${eur})` : ""}`);
      }
    }

    if (dr.taxeChf) {
      const eur = chfToEur(dr.taxeChf, rate);
      lines.push(`${t(lang, "touristTaxChf")}: CHF ${dr.taxeChf}${eur ? ` (≈ €${eur})` : ""}`);
    }

    if (dr.commentaire.trim()) {
      lines.push(`${dr.commentaire.trim()}`);
    }

    lines.push("");
  }

  if (state.commentaireGeneral.trim()) {
    lines.push("");
    lines.push(state.commentaireGeneral.trim());
  }

  return lines.join("\n").trim();
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

export function isTemplateValid(state: TemplateState): boolean {
  return state.dateResponses.some((d) => d.disponible);
}

// ---------------------------------------------------------------------------
// Date formatting
// ---------------------------------------------------------------------------

export function formatDateInput(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// Lang detection
// ---------------------------------------------------------------------------

export function detectLang(langue?: string | null): Lang {
  if (!langue) return "fr";
  const l = langue.toLowerCase();
  if (l.startsWith("ang") || l.startsWith("en")) return "en";
  if (l.startsWith("all") || l.startsWith("de") || l.startsWith("ger")) return "de";
  return "fr";
}
