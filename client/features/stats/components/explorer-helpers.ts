export const COLORS = [
  "#1e3a5f",
  "#f59e0b",
  "#10b981",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
  "#f97316",
  "#ec4899",
  "#84cc16",
  "#6366f1",
  "#14b8a6",
  "#f43f5e",
  "#a855f7",
  "#eab308",
  "#0ea5e9",
];

export const numberFormatter = new Intl.NumberFormat("fr-FR", {
  maximumFractionDigits: 1,
});

export function normalizeLabel(value?: string | null) {
  if (!value) return "Non renseigné";
  const trimmed = value.trim();
  if (!trimmed) return "Non renseigné";
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}
