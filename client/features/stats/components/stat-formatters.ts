export const numberFormatter = new Intl.NumberFormat("fr-FR", {
  maximumFractionDigits: 1,
});

export function fmtPct(value: number) {
  return `${numberFormatter.format(value)} %`;
}

export function fmtNum(value: number) {
  return numberFormatter.format(value);
}

export function clampPct(value: number) {
  if (value <= 0) return 0;
  if (value >= 100) return 100;
  return value;
}
