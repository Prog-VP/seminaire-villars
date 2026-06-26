import type { ChartVisibilityKey } from "../chartVisibility";
import { MAIN_CHART_KEYS, MAIN_CHART_LABELS } from "../chartVisibility";
import { DIM_CONFIG, DIM_LABELS } from "../types";

type ChartVisibilitySelectorProps = {
  hiddenCharts: Set<ChartVisibilityKey>;
  onToggle: (chartKey: ChartVisibilityKey) => void;
};

function ChartVisibilityButton({
  chartKey,
  label,
  isVisible,
  onToggle,
}: {
  chartKey: ChartVisibilityKey;
  label: string;
  isVisible: boolean;
  onToggle: (chartKey: ChartVisibilityKey) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onToggle(chartKey)}
      className={`rounded-full border px-2.5 py-1 text-xs font-medium transition ${
        isVisible
          ? "border-brand-300 bg-brand-50 text-brand-700"
          : "border-slate-200 bg-white text-slate-400"
      }`}
    >
      {label}
    </button>
  );
}

export function ChartVisibilitySelector({ hiddenCharts, onToggle }: ChartVisibilitySelectorProps) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="mr-1 text-xs font-medium text-slate-400">Afficher :</span>
      {MAIN_CHART_KEYS.map((chartKey) => (
        <ChartVisibilityButton
          key={chartKey}
          chartKey={chartKey}
          label={MAIN_CHART_LABELS[chartKey]}
          isVisible={!hiddenCharts.has(chartKey)}
          onToggle={onToggle}
        />
      ))}
      {DIM_CONFIG.map(({ dim }) => (
        <ChartVisibilityButton
          key={dim}
          chartKey={dim}
          label={DIM_LABELS[dim]}
          isVisible={!hiddenCharts.has(dim)}
          onToggle={onToggle}
        />
      ))}
    </div>
  );
}
