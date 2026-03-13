export type TemplateState = {
  dateFrom: string;
  dateTo: string;
  roomsSimple: string;
  roomsDouble: string;
  priceChf: string;
  priceEur: string;
  forfaitChf: string;
  forfaitEur: string;
  taxeChf: string;
  taxeEur: string;
};

export const TEMPLATE_DEFAULTS: TemplateState = {
  dateFrom: "",
  dateTo: "",
  roomsSimple: "",
  roomsDouble: "",
  priceChf: "",
  priceEur: "",
  forfaitChf: "",
  forfaitEur: "",
  taxeChf: "",
  taxeEur: "",
};

export const inputClass =
  "mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200";

export function buildTemplateMessage(values: TemplateState) {
  const arrival = formatTemplateDate(values.dateFrom);
  const departure = formatTemplateDate(values.dateTo);
  return [
    `Dates disponibles du ${arrival} au ${departure}`,
    `Chambres disponibles : ${values.roomsSimple} chambres simples / ${values.roomsDouble} doubles`,
    `CHF ${values.priceChf} (€ ${values.priceEur}) par nuit en chambre (simple / double) avec petit-déjeuner (parking inclus)`,
    `Forfait séminaire : CHF ${values.forfaitChf} (€ ${values.forfaitEur}) par personne et par jour`,
    `Taxe de séjour : CHF ${values.taxeChf} (€ ${values.taxeEur}) par personne et par nuit`,
  ].join("\n");
}

export function isTemplateValid(values: TemplateState) {
  return (
    values.dateFrom.trim().length > 0 &&
    values.dateTo.trim().length > 0 &&
    values.roomsSimple.trim().length > 0 &&
    values.roomsDouble.trim().length > 0 &&
    values.priceChf.trim().length > 0 &&
    values.priceEur.trim().length > 0 &&
    values.forfaitChf.trim().length > 0 &&
    values.forfaitEur.trim().length > 0 &&
    values.taxeChf.trim().length > 0 &&
    values.taxeEur.trim().length > 0
  );
}

export function formatTemplateDate(value: string) {
  if (!value) return "…";
  try {
    return new Intl.DateTimeFormat("fr-CH", { dateStyle: "medium" }).format(
      new Date(value)
    );
  } catch {
    return value;
  }
}

export function formatDateInput(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}
