"use client";

import { fmtPct, numberFormatter } from "./stat-formatters";

export function SectionHeader({
  title,
  description,
  size = "base",
}: {
  title: string;
  description: string;
  size?: "base" | "small";
}) {
  const titleClass =
    size === "small"
      ? "text-lg font-semibold text-slate-900"
      : "text-xl font-semibold text-slate-900";

  return (
    <div className="space-y-1">
      <p className={titleClass}>{title}</p>
      <p className="text-sm text-slate-500">{description}</p>
    </div>
  );
}

export function HighlightCard({
  label,
  value,
  helperText,
}: {
  label: string;
  value: string;
  helperText: string;
}) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-3 text-2xl font-semibold text-slate-900">{value}</p>
      <p className="mt-2 text-sm text-slate-500">{helperText}</p>
    </article>
  );
}

export function SeasonStat({
  label,
  percentage,
  count,
}: {
  label: string;
  percentage: number;
  count: number;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold text-slate-900">
        {fmtPct(percentage)}
      </p>
      <p className="text-xs text-slate-500">
        {count} offre{count > 1 ? "s" : ""}
      </p>
    </div>
  );
}

export function HeaderPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/15 bg-white/10 px-3 py-2">
      <p className="text-[0.7rem] uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="text-lg font-semibold text-white">{value}</p>
    </div>
  );
}

export function LegendDot({
  colorClass,
  label,
}: {
  colorClass: string;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className={`h-2 w-2 rounded-full ${colorClass}`} />
      <span>{label}</span>
    </span>
  );
}

export function EvolutionCard({
  label,
  current,
  previous,
  formatValue,
}: {
  label: string;
  current: number | null;
  previous: number | null;
  formatValue?: (v: number | null) => string;
}) {
  const fmt = formatValue ?? ((v: number | null) => (v !== null ? String(v) : "\u2014"));
  let variationPct: number | null = null;
  if (
    current !== null &&
    previous !== null &&
    previous > 0
  ) {
    variationPct = ((current - previous) / previous) * 100;
  }

  const arrow =
    variationPct !== null
      ? variationPct > 0
        ? "\u2191"
        : variationPct < 0
          ? "\u2193"
          : "\u2192"
      : null;

  const arrowColor =
    variationPct !== null
      ? variationPct > 0
        ? "text-emerald-600"
        : variationPct < 0
          ? "text-rose-600"
          : "text-slate-500"
      : "";

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-900">
        {fmt(current)}
      </p>
      {variationPct !== null && (
        <p className={`mt-1 text-sm font-medium ${arrowColor}`}>
          {arrow} {numberFormatter.format(Math.abs(variationPct))} %
          <span className="ml-1 font-normal text-slate-400">
            vs {fmt(previous)}
          </span>
        </p>
      )}
    </article>
  );
}
