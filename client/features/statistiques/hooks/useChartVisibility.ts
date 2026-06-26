import { useCallback, useMemo } from "react";
import type { ChartVisibilityKey } from "../chartVisibility";
import { readHiddenCharts, writeHiddenCharts } from "../chartVisibility";

type SearchParamsReader = {
  get: (name: string) => string | null;
};

type PushParams = (updater: (params: URLSearchParams) => void) => void;

export function useChartVisibility(searchParams: SearchParamsReader, pushParams: PushParams) {
  const hiddenCharts = useMemo(
    () => readHiddenCharts(searchParams.get("hide")),
    [searchParams],
  );

  const toggleChartVisibility = useCallback((chartKey: ChartVisibilityKey) => {
    pushParams((params) => {
      const nextHiddenCharts = new Set(hiddenCharts);
      if (nextHiddenCharts.has(chartKey)) {
        nextHiddenCharts.delete(chartKey);
      } else {
        nextHiddenCharts.add(chartKey);
      }
      params.set("hide", writeHiddenCharts(nextHiddenCharts));
    });
  }, [hiddenCharts, pushParams]);

  return {
    hiddenCharts,
    toggleChartVisibility,
  };
}
