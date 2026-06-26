import type { KeyboardEvent } from "react";
import { pct } from "../data";

export type PieChartItem = {
  label: string;
  value: number;
  color: string;
  isOther?: boolean;
};

type PositionedPieChartItem = PieChartItem & {
  rate: string;
  startAngle: number;
  endAngle: number;
};

type PieChartProps = {
  items: PieChartItem[];
  total: number;
  year: number;
  activeLabel?: string;
  onClickItem?: (label: string) => void;
};

const PIE_CENTER = 90;
const PIE_RADIUS = 78;
const PIE_LABEL_RADIUS = 36;

function piePoint(angle: number) {
  const radians = (angle - 90) * (Math.PI / 180);
  return {
    x: PIE_CENTER + PIE_RADIUS * Math.cos(radians),
    y: PIE_CENTER + PIE_RADIUS * Math.sin(radians),
  };
}

function piePath(startAngle: number, endAngle: number) {
  const start = piePoint(startAngle);
  const end = piePoint(endAngle);
  const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;
  return [
    `M ${PIE_CENTER} ${PIE_CENTER}`,
    `L ${start.x} ${start.y}`,
    `A ${PIE_RADIUS} ${PIE_RADIUS} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`,
    "Z",
  ].join(" ");
}

function pieLabelPoint(startAngle: number, endAngle: number) {
  const angle = (startAngle + endAngle) / 2;
  const radians = (angle - 90) * (Math.PI / 180);
  return {
    x: PIE_CENTER + PIE_LABEL_RADIUS * Math.cos(radians),
    y: PIE_CENTER + PIE_LABEL_RADIUS * Math.sin(radians),
  };
}

function compactRate(rate: string) {
  return rate.replace(/\.0$/, "");
}

function canShowPieLabel(item: PositionedPieChartItem) {
  const labelLength = Math.max(`${compactRate(item.rate)}%`.length, `(${item.value})`.length);
  const sliceAngle = item.endAngle - item.startAngle;
  const arcLength = (sliceAngle * Math.PI * PIE_LABEL_RADIUS) / 180;
  return sliceAngle >= 24 && arcLength >= labelLength * 5.5;
}

function buildPositionedItems(items: PieChartItem[], total: number) {
  let startAngle = 0;
  return items.map((item) => {
    const endAngle = startAngle + (item.value / total) * 360;
    const positionedItem = {
      ...item,
      rate: pct(item.value, total),
      startAngle,
      endAngle,
    };
    startAngle = endAngle;
    return positionedItem;
  });
}

export function PieChart({ items, total, year, activeLabel, onClickItem }: PieChartProps) {
  const positionedItems = buildPositionedItems(items, total);

  const handleKeyDown = (
    event: KeyboardEvent<SVGPathElement | SVGCircleElement>,
    item: PositionedPieChartItem,
  ) => {
    if (item.isOther || !onClickItem) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onClickItem(item.label);
    }
  };

  return (
    <div className="chart-pie-shell inline-grid max-w-[760px] items-center gap-5 py-2 align-middle md:grid-cols-[176px_minmax(0,1fr)]">
      <svg viewBox="0 0 180 180" className="chart-pie-svg h-44 w-44 justify-self-center" aria-label={`Répartition ${year}`}>
        {positionedItems.map((item) => {
          const isActive = activeLabel === item.label;
          const isDimmed = activeLabel != null && !isActive;
          const commonClassName = `transition-opacity ${isDimmed ? "opacity-30" : "opacity-100"} ${item.isOther ? "" : "cursor-pointer hover:opacity-80"}`;
          const title = `${item.label} (${year}) — ${item.value} offres, ${item.rate}%`;

          if (positionedItems.length === 1) {
            return (
              <circle
                key={item.label}
                cx={PIE_CENTER}
                cy={PIE_CENTER}
                r={PIE_RADIUS}
                fill={item.color}
                className={commonClassName}
                onClick={item.isOther ? undefined : () => onClickItem?.(item.label)}
                onKeyDown={(event) => handleKeyDown(event, item)}
                role={item.isOther || !onClickItem ? undefined : "button"}
                tabIndex={item.isOther || !onClickItem ? undefined : 0}
              >
                <title>{title}</title>
              </circle>
            );
          }

          return (
            <path
              key={item.label}
              d={piePath(item.startAngle, item.endAngle)}
              fill={item.color}
              className={commonClassName}
              onClick={item.isOther ? undefined : () => onClickItem?.(item.label)}
              onKeyDown={(event) => handleKeyDown(event, item)}
              role={item.isOther || !onClickItem ? undefined : "button"}
              tabIndex={item.isOther || !onClickItem ? undefined : 0}
            >
              <title>{title}</title>
            </path>
          );
        })}
        {positionedItems.map((item) => {
          if (!canShowPieLabel(item)) return null;
          const isActive = activeLabel === item.label;
          const isDimmed = activeLabel != null && !isActive;
          const point = positionedItems.length === 1
            ? { x: PIE_CENTER, y: PIE_CENTER }
            : pieLabelPoint(item.startAngle, item.endAngle);

          return (
            <text
              key={`${item.label}-label`}
              x={point.x}
              y={point.y}
              fill="#ffffff"
              fontFamily="Arial, Helvetica, sans-serif"
              fontSize="9"
              fontWeight="600"
              dominantBaseline="middle"
              alignmentBaseline="middle"
              textAnchor="middle"
              className={`chart-pie-label pointer-events-none select-none tabular-nums ${isDimmed ? "opacity-30" : ""}`}
              style={{ fill: "#ffffff" }}
            >
              <tspan x={point.x} dy="-0.35em">
                {compactRate(item.rate)}%
              </tspan>
              <tspan x={point.x} dy="1.15em">
                ({item.value})
              </tspan>
            </text>
          );
        })}
      </svg>
      <div className="chart-pie-legend grid min-w-0 content-center gap-x-4 gap-y-1.5 sm:grid-cols-2 xl:grid-cols-3">
        {positionedItems.map((item) => {
          const isActive = activeLabel === item.label;
          const isDimmed = activeLabel != null && !isActive;
          const isClickable = !item.isOther && Boolean(onClickItem);
          const className = `chart-pie-legend-item inline-flex items-center gap-1.5 rounded border border-transparent px-2 py-1 text-left text-xs transition ${
            isClickable ? "hover:border-slate-200 hover:bg-slate-50" : "cursor-default"
          } ${isActive ? "bg-brand-50 text-brand-800" : "text-slate-600"} ${isDimmed ? "opacity-40" : ""}`;
          const content = (
            <>
              <span className="chart-pie-legend-swatch h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: item.color }} />
              <span className="font-medium" title={item.label}>
                {item.label}
              </span>
              <span className="tabular-nums font-semibold text-slate-700">{compactRate(item.rate)}%</span>
              <span className="tabular-nums text-slate-400">({item.value})</span>
            </>
          );

          return !isClickable ? (
            <div key={item.label} className={className}>
              {content}
            </div>
          ) : (
            <button key={item.label} type="button" onClick={() => onClickItem?.(item.label)} className={className}>
              {content}
            </button>
          );
        })}
      </div>
    </div>
  );
}
