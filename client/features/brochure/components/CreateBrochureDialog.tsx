"use client";

import { useEffect, useState } from "react";
import type { Offer, HotelResponse } from "@/features/offres/types";
import type { Lang } from "@/features/offres/i18n";
import { createShareLink } from "@/features/offres/api";
import { createOfferBrochure } from "../api";
import { DESTINATIONS } from "../utils";
import type { OfferBrochure } from "../types";

type Props = {
  offer: Offer;
  onClose: () => void;
  onCreated: (brochure: OfferBrochure) => void;
  onTokenCreated?: (token: string) => void;
};

/** Map offer.langue setting value to brochure lang code */
function mapLangue(langue?: string): Lang {
  if (!langue) return "fr";
  const lower = langue.toLowerCase();
  if (lower.includes("anglais") || lower.includes("english")) return "en";
  if (lower.includes("allemand") || lower.includes("deutsch") || lower.includes("german")) return "de";
  return "fr";
}

/** Map offer.stationDemandee to destination code */
function mapDestination(station?: string): string {
  if (!station) return "villars";
  const lower = station.toLowerCase();
  if (lower.includes("diableret")) return "diablerets";
  return "villars";
}

export function CreateBrochureDialog({
  offer,
  onClose,
  onCreated,
  onTokenCreated,
}: Props) {
  const responses = offer.hotelResponses ?? [];
  const [destination, setDestination] = useState(
    mapDestination(offer.stationDemandee)
  );
  const [lang, setLang] = useState<Lang>(mapLangue(offer.langue));
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(responses.map((r) => r.id!).filter(Boolean))
  );
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const toggleResponse = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const isAllSelected =
    responses.length > 0 &&
    responses.every((r) => r.id && selected.has(r.id));

  const toggleAll = () => {
    if (isAllSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(responses.map((r) => r.id!).filter(Boolean)));
    }
  };

  const handleCreate = async () => {
    setIsCreating(true);
    setError(null);
    try {
      // Ensure share token exists (needed for public brochure URL)
      if (!offer.shareToken) {
        const { token } = await createShareLink(offer.id);
        onTokenCreated?.(token);
      }

      const selectedResponses = responses.filter(
        (r) => r.id && selected.has(r.id)
      );
      const brochure = await createOfferBrochure(
        offer.id,
        destination,
        lang,
        selectedResponses
      );
      onCreated(brochure);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de créer la brochure."
      );
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex max-h-[85vh] w-full max-w-xl flex-col rounded-xl border border-slate-200 bg-white shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Créer la brochure
            </h2>
            <p className="text-sm text-slate-500">{offer.societeContact}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
          {/* Destination */}
          <div>
            <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-500">
              Destination
            </label>
            <div className="flex gap-2">
              {DESTINATIONS.map((d) => (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => setDestination(d.value)}
                  className={`rounded-lg px-4 py-1.5 text-sm font-medium transition ${
                    destination === d.value
                      ? "bg-brand-900 text-white"
                      : "border border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Language */}
          <div>
            <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-500">
              Langue
            </label>
            <div className="flex gap-2">
              {(["fr", "en", "de"] as const).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLang(l)}
                  className={`rounded-lg px-4 py-1.5 text-sm font-medium transition ${
                    lang === l
                      ? "bg-brand-900 text-white"
                      : "border border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900"
                  }`}
                >
                  {l === "fr" ? "Français" : l === "en" ? "English" : "Deutsch"}
                </button>
              ))}
            </div>
          </div>

          {/* Hotel responses selection */}
          {responses.length > 0 && (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Réponses hôtels à inclure
                </label>
                <label className="flex items-center gap-1.5 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={toggleAll}
                    className="h-4 w-4 rounded border-slate-300 text-brand-900 focus:ring-brand-900"
                  />
                  Tout
                </label>
              </div>
              <div className="space-y-1">
                {responses.map((r) => (
                  <ResponseRow
                    key={r.id}
                    response={r}
                    isChecked={!!r.id && selected.has(r.id)}
                    onToggle={() => r.id && toggleResponse(r.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-100 px-6 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleCreate}
            disabled={isCreating}
            className="rounded-lg bg-gradient-to-r from-brand-900 to-brand-700 px-4 py-2 text-sm font-medium text-white transition hover:from-brand-800 hover:to-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isCreating ? "Création…" : "Créer la brochure"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ResponseRow({
  response,
  isChecked,
  onToggle,
}: {
  response: HotelResponse;
  isChecked: boolean;
  onToggle: () => void;
}) {
  return (
    <label
      className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 transition ${
        isChecked
          ? "border-brand-200 bg-brand-50"
          : "border-slate-200 hover:border-slate-300"
      }`}
    >
      <input
        type="checkbox"
        checked={isChecked}
        onChange={onToggle}
        className="h-4 w-4 rounded border-slate-300 text-brand-900 focus:ring-brand-900"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-900">
          {response.hotelName}
        </p>
        {response.respondentName && (
          <p className="truncate text-xs text-slate-500">
            {response.respondentName}
          </p>
        )}
      </div>
      {response.createdAt && (
        <span className="shrink-0 text-xs text-slate-400">
          {new Date(response.createdAt).toLocaleDateString("fr-CH")}
        </span>
      )}
    </label>
  );
}
