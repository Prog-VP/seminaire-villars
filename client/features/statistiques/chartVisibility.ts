import type { Dimension } from "./types";
import { DIM_CONFIG } from "./types";

export const MAIN_CHART_KEYS = ["totalEnvoi", "mEnvoi", "mSejour"] as const;

export type MainChartKey = (typeof MAIN_CHART_KEYS)[number];
export type ChartVisibilityKey = MainChartKey | Dimension;

export const MAIN_CHART_LABELS: Record<MainChartKey, string> = {
  totalEnvoi: "Total annuel",
  mEnvoi: "Mois envoi",
  mSejour: "Mois séjour",
};

export const ALL_CHART_KEYS: ChartVisibilityKey[] = [
  ...MAIN_CHART_KEYS,
  ...DIM_CONFIG.map(({ dim }) => dim),
];

export const DEFAULT_HIDDEN_CHARTS = new Set<ChartVisibilityKey>(
  ALL_CHART_KEYS.filter((key) => key !== "totalEnvoi"),
);

const ALL_VISIBLE_PARAM = "none";

function isChartVisibilityKey(value: string): value is ChartVisibilityKey {
  return ALL_CHART_KEYS.includes(value as ChartVisibilityKey);
}

export function readHiddenCharts(value: string | null) {
  if (value === null) return new Set(DEFAULT_HIDDEN_CHARTS);
  if (value === ALL_VISIBLE_PARAM) return new Set<ChartVisibilityKey>();

  return new Set(
    value
      .split(",")
      .filter(isChartVisibilityKey),
  );
}

export function writeHiddenCharts(hiddenCharts: Set<ChartVisibilityKey>) {
  if (hiddenCharts.size === 0) return ALL_VISIBLE_PARAM;
  return ALL_CHART_KEYS.filter((key) => hiddenCharts.has(key)).join(",");
}
