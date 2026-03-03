"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const DEFAULT_COLORS = [
  "#1e3a5f",
  "#f59e0b",
  "#10b981",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
  "#f97316",
  "#ec4899",
];

type PieChartCardProps = {
  title: string;
  description: string;
  data: { label: string; count: number; percentage: number }[];
  colors?: string[];
};

const numberFormatter = new Intl.NumberFormat("fr-FR", {
  maximumFractionDigits: 1,
});

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: { label: string; count: number; percentage: number } }[];
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

export function PieChartCard({
  title,
  description,
  data,
  colors = DEFAULT_COLORS,
}: PieChartCardProps) {
  if (!data.length) {
    return (
      <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-lg font-semibold text-slate-900">{title}</p>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
        <p className="mt-6 text-sm text-slate-400">Aucune donnée.</p>
      </article>
    );
  }

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-lg font-semibold text-slate-900">{title}</p>
      <p className="mt-1 text-sm text-slate-500">{description}</p>

      <div className="mt-4 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="count"
              nameKey="label"
              cx="50%"
              cy="50%"
              outerRadius={90}
              innerRadius={40}
            >
              {data.map((_, idx) => (
                <Cell
                  key={idx}
                  fill={colors[idx % colors.length]}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
        {data.map((item, idx) => (
          <span key={item.label} className="inline-flex items-center gap-2 text-xs text-slate-700">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: colors[idx % colors.length] }}
            />
            <span>
              {item.label}{" "}
              <span className="font-semibold">({item.count})</span>
            </span>
          </span>
        ))}
      </div>
    </article>
  );
}
