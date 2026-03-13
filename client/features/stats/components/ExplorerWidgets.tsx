"use client";

import Link from "next/link";
import type { Offer } from "@/features/offres/types";
import { normalizeStatut } from "@/features/offres/utils";
import { numberFormatter } from "./explorer-helpers";

// ---------------------------------------------------------------------------
// Tooltips
// ---------------------------------------------------------------------------

export function PieTooltip({
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

export function BarTooltip({
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
            {p.name}: {p.value} (
            {numberFormatter.format((p.value / total) * 100)}
            %)
          </p>
        ))}
      <p className="mt-1 border-t border-slate-100 pt-1 font-medium text-slate-900">
        Total: {total}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Offers dropdown panel
// ---------------------------------------------------------------------------

export function OffersDropdown({
  label,
  year,
  offers,
  color,
  onClose,
}: {
  label: string;
  year?: number;
  offers: Offer[];
  color: string;
  onClose: () => void;
}) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
        <div className="flex items-center gap-3">
          <span
            className="inline-block h-3 w-3 rounded-full"
            style={{ backgroundColor: color }}
          />
          <p className="text-sm font-semibold text-slate-900">
            {label}
            {year ? ` — ${year}` : ""}
            <span className="ml-2 font-normal text-slate-500">
              ({offers.length} offre{offers.length > 1 ? "s" : ""})
            </span>
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-4 w-4"
          >
            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
          </svg>
        </button>
      </div>

      {offers.length > 0 ? (
        <div className="max-h-80 overflow-y-auto">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2 font-medium">N°</th>
                <th className="px-4 py-2 font-medium">Société</th>
                <th className="px-4 py-2 font-medium hidden sm:table-cell">Contact</th>
                <th className="px-4 py-2 font-medium hidden md:table-cell">Statut</th>
                <th className="px-4 py-2 font-medium hidden lg:table-cell">Pax</th>
              </tr>
            </thead>
            <tbody>
              {offers.map((offer, i) => (
                <tr
                  key={offer.id}
                  className={`border-t border-slate-50 ${i % 2 === 1 ? "bg-slate-50/60" : ""}`}
                >
                  <td className="px-4 py-2 text-slate-500">
                    <Link
                      href={`/offres/${offer.id}`}
                      className="text-brand-700 underline underline-offset-2 hover:text-brand-900"
                    >
                      {offer.numeroOffre ?? "—"}
                    </Link>
                  </td>
                  <td className="px-4 py-2 font-medium text-slate-900">
                    {offer.societeContact}
                  </td>
                  <td className="px-4 py-2 text-slate-600 hidden sm:table-cell">
                    {[offer.prenomContact, offer.nomContact]
                      .filter(Boolean)
                      .join(" ") || "—"}
                  </td>
                  <td className="px-4 py-2 hidden md:table-cell">
                    <span className="inline-block rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                      {normalizeStatut(offer.statut)}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-slate-600 hidden lg:table-cell">
                    {offer.nombrePax ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="px-5 py-6 text-center text-sm text-slate-400">
          Aucune offre correspondante.
        </p>
      )}
    </article>
  );
}
