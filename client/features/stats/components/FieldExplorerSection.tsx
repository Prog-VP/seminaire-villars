"use client";

import { useState, useMemo, useCallback } from "react";
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
import { COLORS, numberFormatter, normalizeLabel } from "./explorer-helpers";
import { PieTooltip, BarTooltip, OffersDropdown } from "./ExplorerWidgets";

type Props = {
  offers: Offer[];
  selectedYear: number | null;
};

type Selection = {
  label: string;
  year?: number;
} | null;

export function FieldExplorerSection({ offers, selectedYear }: Props) {
  const [selectedFieldKey, setSelectedFieldKey] = useState(
    ANALYZABLE_FIELDS[0].key,
  );
  const [selection, setSelection] = useState<Selection>(null);

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

  // Build recharts data
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

  // Color map
  const colorMap = useMemo(() => {
    const map = new Map<string, string>();
    allLabels.forEach((label, idx) => {
      map.set(label, COLORS[idx % COLORS.length]);
    });
    return map;
  }, [allLabels]);

  // Matching offers for selection
  const matchingOffers = useMemo(() => {
    if (!selection) return [];
    let base = selection.year
      ? filterOffersByYear(offers, selection.year)
      : filteredOffers;
    return base.filter(
      (o) => normalizeLabel(field.accessor(o)) === selection.label,
    );
  }, [selection, offers, filteredOffers, field]);

  const toggleSelection = useCallback(
    (label: string, year?: number) => {
      setSelection((prev) => {
        if (prev?.label === label && prev?.year === year) return null;
        return { label, year };
      });
    },
    [],
  );

  // Reset selection when field changes
  const handleFieldChange = useCallback((key: string) => {
    setSelectedFieldKey(key);
    setSelection(null);
  }, []);

  // Handle pie click
  const handlePieClick = useCallback(
    (_: unknown, index: number) => {
      const item = pieData[index];
      if (item) toggleSelection(item.label);
    },
    [pieData, toggleSelection],
  );

  // Handle bar click
  const handleBarClick = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (label: string) => (data: any) => {
      const year = Number(data?.year);
      if (year) toggleSelection(label, year);
    },
    [toggleSelection],
  );

  return (
    <section className="space-y-6">
      <div className="space-y-1.5">
        <p className="text-2xl font-semibold text-slate-900">
          Exploration par champ
        </p>
        <p className="text-sm text-slate-500">
          Sélectionnez un champ pour voir sa répartition. Cliquez sur un segment
          ou une valeur pour voir les offres associées.
        </p>
      </div>

      {/* Field selector */}
      <div>
        <select
          value={selectedFieldKey}
          onChange={(e) => handleFieldChange(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
        >
          {ANALYZABLE_FIELDS.map((f) => (
            <option key={f.key} value={f.key}>
              {f.label}
            </option>
          ))}
        </select>
      </div>

      {/* Pie chart */}
      <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-lg font-semibold text-slate-900">
          {field.label}
          {selectedYear ? ` — ${selectedYear}` : " — Toutes les années"}
        </p>
        <p className="mt-1 text-sm text-slate-500">
          Répartition sur {filteredOffers.length} offre
          {filteredOffers.length > 1 ? "s" : ""}. Cliquez pour détailler.
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
                    className="cursor-pointer"
                    onClick={handlePieClick}
                  >
                    {pieData.map((d) => (
                      <Cell
                        key={d.label}
                        fill={colorMap.get(d.label) ?? COLORS[0]}
                        stroke={
                          selection?.label === d.label && !selection?.year
                            ? "#1e293b"
                            : "transparent"
                        }
                        strokeWidth={
                          selection?.label === d.label && !selection?.year
                            ? 3
                            : 0
                        }
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Legend — clickable */}
            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
              {pieData.map((item) => {
                const isActive =
                  selection?.label === item.label && !selection?.year;
                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => toggleSelection(item.label)}
                    className={`inline-flex items-center gap-2 rounded-md px-2 py-1 text-xs transition ${
                      isActive
                        ? "bg-slate-100 font-bold text-slate-900 ring-1 ring-slate-300"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-full"
                      style={{
                        backgroundColor:
                          colorMap.get(item.label) ?? COLORS[0],
                      }}
                    />
                    <span>
                      {item.label}{" "}
                      <span className="font-semibold">
                        ({item.count} &middot;{" "}
                        {numberFormatter.format(item.percentage)}%)
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <p className="mt-6 text-sm text-slate-400">Aucune donnée.</p>
        )}
      </article>

      {/* Stacked bar chart */}
      {barData.length > 0 && (
        <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-lg font-semibold text-slate-900">
            Évolution — {field.label}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Histogramme empilé par année. Cliquez sur un segment pour voir les
            offres.
          </p>

          <div
            className="mt-4"
            style={{ height: Math.max(300, barData.length * 60 + 80) }}
          >
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
                    className="cursor-pointer"
                    onClick={handleBarClick(label)}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>
      )}

      {/* Offers dropdown */}
      {selection && (
        <OffersDropdown
          label={selection.label}
          year={selection.year}
          offers={matchingOffers}
          color={colorMap.get(selection.label) ?? COLORS[0]}
          onClose={() => setSelection(null)}
        />
      )}
    </section>
  );
}
