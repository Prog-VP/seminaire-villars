"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Offer, OfferComment } from "@/features/offres/types";
import type { Filters, MonthFilters, YearFilters } from "../types";
import { PAGE_SIZE } from "../types";
import { fmtDate } from "../data";

/* ── External link icon (reused) ── */

const ExternalIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="hidden h-2.5 w-2.5 opacity-50 group-hover:inline-block">
    <path d="M6.22 8.72a.75.75 0 0 0 1.06 1.06l5.22-5.22v1.69a.75.75 0 0 0 1.5 0v-3.5a.75.75 0 0 0-.75-.75h-3.5a.75.75 0 0 0 0 1.5h1.69L6.22 8.72Z" />
    <path d="M3.5 6.75c0-.69.56-1.25 1.25-1.25H7A.75.75 0 0 0 7 4H4.75A2.75 2.75 0 0 0 2 6.75v4.5A2.75 2.75 0 0 0 4.75 14h4.5A2.75 2.75 0 0 0 12 11.25V9a.75.75 0 0 0-1.5 0v2.25c0 .69-.56 1.25-1.25 1.25h-4.5c-.69 0-1.25-.56-1.25-1.25v-4.5Z" />
  </svg>
);

/* ── Boolean dot indicator ── */

function BoolDot({ on }: { on?: boolean }) {
  return on ? (
    <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" title="Oui" />
  ) : (
    <span className="inline-block h-2 w-2 rounded-full bg-slate-200" title="Non" />
  );
}

/* ── Comments popover ── */

function CommentsPopover({ comments, societe }: { comments: OfferComment[]; societe: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-200"
      >
        {comments.length}
      </button>
      {open && (
        <div
          className="fixed z-[9999] w-80 rounded-xl border border-slate-200 bg-white p-4 shadow-xl"
          style={{ bottom: "auto", right: "auto" }}
          ref={(el) => {
            if (!el || !ref.current) return;
            const btn = ref.current.querySelector("button");
            if (!btn) return;
            const rect = btn.getBoundingClientRect();
            el.style.left = `${Math.max(8, rect.right - 320)}px`;
            el.style.top = `${Math.max(8, rect.top - el.offsetHeight - 8)}px`;
          }}
        >
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Notes — {societe}
          </p>
          <div className="max-h-64 space-y-3 overflow-y-auto">
            {comments.map((c) => (
              <div key={c.id} className="rounded-lg bg-slate-50 px-3 py-2 text-sm">
                <p className="mb-0.5 text-xs font-medium text-slate-500">
                  {c.author || "—"}
                  {c.date ? ` · ${new Date(c.date).toLocaleDateString("fr-CH")}` : ""}
                </p>
                <p className="whitespace-pre-line text-slate-700">{c.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Filtered offers table ── */

export function FilteredOffersTable({ offers, hasFilters, filters, yearFilters, monthFilters, filteredOfferIds }: {
  offers: Offer[];
  hasFilters: boolean;
  filters: Filters;
  yearFilters: YearFilters;
  monthFilters: MonthFilters;
  filteredOfferIds?: string[];
}) {
  const [page, setPage] = useState(0);

  const offersKey = offers.length;
  const [prevKey, setPrevKey] = useState(offersKey);
  if (offersKey !== prevKey) {
    setPrevKey(offersKey);
    setPage(0);
  }

  const router = useRouter();

  const totalPages = Math.ceil(offers.length / PAGE_SIZE);
  const paged = offers.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  /** Store filtered offer IDs, then open Offres page */
  const openInOffres = useCallback(() => {
    if (filteredOfferIds && filteredOfferIds.length > 0) {
      localStorage.setItem("offer-filter-ids", JSON.stringify(filteredOfferIds));
    }
    window.open("/offres", "_blank");
  }, [filters, filteredOfferIds]);

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Offres correspondantes
            <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
              {offers.length}
            </span>
          </h3>
          {hasFilters && (
            <button
              type="button"
              onClick={openInOffres}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-slate-900"
            >
              Voir dans Offres
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3 w-3">
                <path d="M6.22 8.72a.75.75 0 0 0 1.06 1.06l5.22-5.22v1.69a.75.75 0 0 0 1.5 0v-3.5a.75.75 0 0 0-.75-.75h-3.5a.75.75 0 0 0 0 1.5h1.69L6.22 8.72Z" />
                <path d="M3.5 6.75c0-.69.56-1.25 1.25-1.25H7A.75.75 0 0 0 7 4H4.75A2.75 2.75 0 0 0 2 6.75v4.5A2.75 2.75 0 0 0 4.75 14h4.5A2.75 2.75 0 0 0 12 11.25V9a.75.75 0 0 0-1.5 0v2.25c0 .69-.56 1.25-1.25 1.25h-4.5c-.69 0-1.25-.56-1.25-1.25v-4.5Z" />
              </svg>
            </button>
          )}
        </div>
        {!hasFilters && (
          <p className="text-xs text-slate-400">Cliquez sur un graphique pour filtrer</p>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/60 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <th className="px-3 py-2">N°</th>
              <th className="px-3 py-2">Société</th>
              <th className="px-3 py-2">Statut</th>
              <th className="px-3 py-2">Date envoi</th>
              <th className="px-3 py-2">Pays</th>
              <th className="px-3 py-2">Pax</th>
              <th className="px-3 py-2">Nuits</th>
              <th className="px-3 py-2">Station</th>
              <th className="px-3 py-2">Traité par</th>
              <th className="px-3 py-2 text-center">Notes</th>
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 && (
              <tr>
                <td colSpan={10} className="px-3 py-6 text-center text-slate-400">
                  Aucune offre
                </td>
              </tr>
            )}
            {paged.map((o, i) => (
              <tr
                key={o.id}
                className={`border-t border-slate-100 transition hover:bg-slate-50 ${
                  i % 2 === 1 ? "bg-slate-50/40" : ""
                }`}
              >
                <td className="px-3 py-2 whitespace-nowrap">
                  <Link
                    href={`/offres/${o.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Ouvrir dans un nouvel onglet"
                    className="group inline-flex items-center gap-1 font-medium text-brand-700 hover:text-brand-900 hover:underline"
                  >
                    {o.numeroOffre ?? "—"}
                    {ExternalIcon}
                  </Link>
                </td>
                <td className="px-3 py-2 max-w-[200px] truncate" title={o.societeContact}>
                  <Link
                    href={`/offres/${o.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Ouvrir dans un nouvel onglet"
                    className="text-slate-900 hover:text-brand-700 hover:underline"
                  >
                    {o.societeContact}
                  </Link>
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  <span className="inline-block rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                    {o.statut || "—"}
                  </span>
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-slate-600">{fmtDate(o.dateEnvoiOffre)}</td>
                <td className="px-3 py-2 whitespace-nowrap text-slate-600">{o.pays || "—"}</td>
                <td className="px-3 py-2 whitespace-nowrap tabular-nums text-slate-600">{o.nombrePax ?? "—"}</td>
                <td className="px-3 py-2 whitespace-nowrap tabular-nums text-slate-600">{o.nombreDeNuits ?? "—"}</td>
                <td className="px-3 py-2 whitespace-nowrap text-slate-600">{o.stationDemandee || "—"}</td>
                <td className="px-3 py-2 whitespace-nowrap text-slate-600">{o.traitePar || "—"}</td>
                <td className="px-3 py-2 text-center" onClick={(e) => e.stopPropagation()}>
                  {(o.comments ?? []).length > 0 ? (
                    <CommentsPopover comments={o.comments!} societe={o.societeContact} />
                  ) : (
                    <span className="text-xs text-slate-300">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-100 px-5 py-2">
          <p className="text-xs text-slate-400">
            Page {page + 1} / {totalPages}
          </p>
          <div className="flex gap-1">
            <button
              type="button"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-md px-2 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-100 disabled:opacity-30"
            >
              Précédent
            </button>
            <button
              type="button"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-md px-2 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-100 disabled:opacity-30"
            >
              Suivant
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
