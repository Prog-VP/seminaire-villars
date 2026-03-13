import type { Lang } from "../i18n";
import { t, formatDateLocale } from "../i18n";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DateOptionResponse = {
  disponible: boolean;
  dateFrom: string;
  dateTo: string;
  priceSimpleChf: string;
  priceDoubleChf: string;
  demiPensionChf: string;
  pensionCompleteChf: string;
  forfaitSeminaireChf: string;
  taxeChf: string;
  commentaire: string;
};

export type TemplateState = {
  dateResponses: DateOptionResponse[];
  roomsSimple: string;
  roomsDouble: string;
  forfaitType: "journee" | "demi-journee";
  commentaireGeneral: string;
};

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

export function createDateOptionResponse(du: string, au: string): DateOptionResponse {
  return {
    disponible: true,
    dateFrom: du,
    dateTo: au,
    priceSimpleChf: "",
    priceDoubleChf: "",
    demiPensionChf: "",
    pensionCompleteChf: "",
    forfaitSeminaireChf: "",
    taxeChf: "",
    commentaire: "",
  };
}

export function createTemplateDefaults(
  dateOptions: { du: string; au: string }[] | undefined,
  confirmeeDu?: string | null,
  confirmeeAu?: string | null,
): TemplateState {
  const options = dateOptions?.length
    ? dateOptions
    : confirmeeDu || confirmeeAu
      ? [{ du: confirmeeDu || "", au: confirmeeAu || "" }]
      : [{ du: "", au: "" }];

  return {
    dateResponses: options.map((o) => createDateOptionResponse(o.du || "", o.au || "")),
    roomsSimple: "",
    roomsDouble: "",
    forfaitType: "journee",
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

    if (opts.showSeminaire && dr.forfaitSeminaireChf) {
      const eur = chfToEur(dr.forfaitSeminaireChf, rate);
      const typeLabel = state.forfaitType === "journee" ? t(lang, "fullDay") : t(lang, "halfDay");
      lines.push(`${t(lang, "seminarPackageChf")} (${typeLabel}): CHF ${dr.forfaitSeminaireChf}${eur ? ` (≈ €${eur})` : ""}`);
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

  if (!opts.activiteUniquement) {
    if (opts.showSimple && state.roomsSimple) {
      lines.push(`${t(lang, "availableRoomsSimple")}: ${state.roomsSimple}`);
    }
    if (opts.showDouble && state.roomsDouble) {
      lines.push(`${t(lang, "availableRoomsDouble")}: ${state.roomsDouble}`);
    }
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
