"use client";

import { useState, useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";
import type { Offer } from "@/features/offres/types";
import {
  ANALYZABLE_FIELDS,
  buildFieldDistribution,
  buildFieldDistributionByYear,
  getAllLabelsForField,
  filterOffersByYear,
} from "../utils";

const COLORS = [
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

const numberFormatter = new Intl.NumberFormat("fr-FR", {
  maximumFractionDigits: 1,
});

type Props = {
  offers: Offer[];
  selectedYear: number | null;
};

export function FieldExplorerSection({ offers, selectedYear }: Props) {
  const [selectedFieldKey, setSelectedFieldKey] = useState(
    ANALYZABLE_FIELDS[0].key,
  );

  const field = ANALYZABLE_FIELDS.find((f) => f.key === selectedFieldKey)!;

  // Pie chart data — filtered by year
  const filteredOffers = useMemo(
    () => filterOffersByYear(offers, selectedYear),
    [offers, selectedYear],
  );
  const pieData = useMemo(
    () => buildFieldDistribution(filteredOffers, field.accessor),
    [filteredOffers, field],
  );

  // Stacked bar data — all years
  const yearDistributions = useMemo(
    () => buildFieldDistributionByYear(offers, field.accessor),
    [offers, field],
  );
  const allLabels = useMemo(
    () => getAllLabelsForField(yearDistributions),
    [yearDistributions],
  );

  // Build recharts data: each entry = { year: "2024", "Villars": 5, "Diablerets": 3, ... }
  const barData = useMemo(() => {
    return yearDistributions.map((dist) => {
      const entry: Record<string, string | number> = {
        year: String(dist.year),
      };
      for (const label of allLabels) {
        const found = dist.values.find((v) => v.label === label);
        entry[label] = found?.count ?? 0;
      }
      return entry;
    });
  }, [yearDistributions, allLabels]);

  // Color map for consistent colors across pie + bars
  const colorMap = useMemo(() => {
    const map = new Map<string, string>();
    allLabels.forEach((label, idx) => {
      map.set(label, COLORS[idx % COLORS.length]);
    });
    return map;
  }, [allLabels]);

  return (
    <section className="space-y-6">
      <div className="space-y-1.5">
        <p className="text-2xl font-semibold text-slate-900">
          Exploration par champ
        </p>
        <p className="text-sm text-slate-500">
          Sélectionnez un champ pour voir sa répartition et son évolution par
          année.
        </p>
      </div>

      {/* Field selector */}
      <div>
        <select
          value={selectedFieldKey}
          onChange={(e) => setSelectedFieldKey(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
        >
          {ANALYZABLE_FIELDS.map((f) => (
            <option key={f.key} value={f.key}>
              {f.label}
            </option>
          ))}
        </select>
      </div>

      {/* Pie chart for current year / all */}
      <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-lg font-semibold text-slate-900">
          {field.label}
          {selectedYear ? ` — ${selectedYear}` : " — Toutes les années"}
        </p>
        <p className="mt-1 text-sm text-slate-500">
          Répartition sur {filteredOffers.length} offre
          {filteredOffers.length > 1 ? "s" : ""}.
        </p>

        {pieData.length > 0 ? (
          <>
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="count"
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    innerRadius={40}
                  >
                    {pieData.map((d) => (
                      <Cell
                        key={d.label}
                        fill={colorMap.get(d.label) ?? COLORS[0]}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
              {pieData.map((item) => (
                <span
                  key={item.label}
                  className="inline-flex items-center gap-2 text-xs text-slate-700"
                >
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full"
                    style={{
                      backgroundColor: colorMap.get(item.label) ?? COLORS[0],
                    }}
                  />
                  <span>
                    {item.label}{" "}
                    <span className="font-semibold">
                      ({item.count} &middot;{" "}
                      {numberFormatter.format(item.percentage)}
                      %)
                    </span>
                  </span>
                </span>
              ))}
            </div>
          </>
        ) : (
          <p className="mt-6 text-sm text-slate-400">Aucune donnée.</p>
        )}
      </article>

      {/* Stacked bar chart — evolution by year */}
      {barData.length > 0 && (
        <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-lg font-semibold text-slate-900">
            Évolution — {field.label}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Histogramme empilé par année. Chaque barre représente une année.
          </p>

          <div className="mt-4" style={{ height: Math.max(300, barData.length * 60 + 80) }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={barData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis
                  dataKey="year"
                  type="category"
                  tick={{ fontSize: 13, fontWeight: 600 }}
                  width={50}
                />
                <Tooltip content={<BarTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: 12 }}
                  iconType="circle"
                  iconSize={8}
                />
                {allLabels.map((label) => (
                  <Bar
                    key={label}
                    dataKey={label}
                    stackId="a"
                    fill={colorMap.get(label) ?? COLORS[0]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Tooltips
// ---------------------------------------------------------------------------

function PieTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: {
    payload: { label: string; count: number; percentage: number };
  }[];
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-md">
      <p className="font-semibold text-slate-900">{d.label}</p>
      <p className="text-slate-600">
        {d.count} offre{d.count > 1 ? "s" : ""} &middot;{" "}
        {numberFormatter.format(d.percentage)} %
      </p>
    </div>
  );
}

function BarTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name: string; value: number; fill: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((sum, p) => sum + (p.value || 0), 0);
  return (
    <div className="max-h-64 overflow-y-auto rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-md">
      <p className="mb-1 font-semibold text-slate-900">{label}</p>
      {payload
        .filter((p) => p.value > 0)
        .sort((a, b) => b.value - a.value)
        .map((p) => (
          <p key={p.name} className="flex items-center gap-2 text-slate-600">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: p.fill }}
            />
            {p.name}: {p.value} ({numberFormatter.format((p.value / total) * 100)}
            %)
          </p>
        ))}
      <p className="mt-1 border-t border-slate-100 pt-1 font-medium text-slate-900">
        Total: {total}
      </p>
    </div>
  );
}
