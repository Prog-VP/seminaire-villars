// ---------------------------------------------------------------------------
// Constants, label mappings, badge colors, helpers and shared types for
// the GenerateOfferDocTab family of components.
// ---------------------------------------------------------------------------

export const SEASON_LABELS: Record<string, string> = {
  ete: "Été",
  hiver: "Hiver",
};

export const LANG_LABELS: Record<string, string> = {
  fr: "Français",
  en: "English",
  de: "Deutsch",
};

export const DEST_LABELS: Record<string, string> = {
  villars: "Villars-sur-Ollon",
  diablerets: "Les Diablerets",
};

export const BADGE_COLORS: Record<string, string> = {
  villars: "bg-blue-100 text-blue-700",
  diablerets: "bg-purple-100 text-purple-700",
  ete: "bg-amber-100 text-amber-700",
  hiver: "bg-sky-100 text-sky-700",
  fr: "bg-slate-100 text-slate-600",
  en: "bg-rose-100 text-rose-600",
  de: "bg-emerald-100 text-emerald-600",
};

export function normalizeLang(langue?: string | null): string {
  if (!langue) return "fr";
  const lower = langue.toLowerCase();
  if (lower.includes("en") || lower.includes("anglais")) return "en";
  if (lower.includes("de") || lower.includes("allemand")) return "de";
  return "fr";
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SelectionItem =
  | { type: "block"; id: string }
  | { type: "response"; id: string };

export function selKey(item: SelectionItem): string {
  return `${item.type}:${item.id}`;
}

export type DocPick = { hotelId: string; docLang: string };
