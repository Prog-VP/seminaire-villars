"use client";

import { useEffect, useMemo, useState } from "react";
import type { Offer, HotelResponse } from "@/features/offres/types";
import type { Hotel } from "@/features/hotels/types";
import { fetchHotels } from "@/features/hotels/api";
import {
  OFFER_PPT_DESTINATION_MODES,
  areOfferPptDestinationsEqual,
  formatOfferPptDestinationLabel,
  normalizeOfferPptDestinations,
  resolveOfferPptDestinations,
  type OfferPptDestinationMode,
} from "@/features/documents/offer-ppt-destinations";
import { buildAvailableOfferText } from "@/features/offres/utils";
import { downloadBlob } from "@/lib/download";
import { OfferDocumentCriteriaCards } from "./OfferDocumentCriteriaCards";
import { OfferDocumentResponseList } from "./OfferDocumentResponseList";

type GenerateOfferDocTabProps = {
  offer: Offer;
  hotelResponses?: HotelResponse[];
};

const DESTINATION_MODE_LABELS: Record<OfferPptDestinationMode, string> = {
  auto: "Auto",
  villars: "Villars",
  diablerets: "Diablerets",
  both: "Les deux",
};

function normalizeLangLabel(langue?: string | null) {
  const value = (langue ?? "").toLowerCase();
  if (value.includes("en") || value.includes("anglais")) return "EN";
  if (value.includes("de") || value.includes("allemand")) return "DE";
  return "FR";
}

function dateToSeason(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const month = date.getUTCMonth() + 1;
  return month >= 11 || month <= 4 ? "HIVER" : "ETE";
}

function resolveSeasonLabels(offer: Offer) {
  const seasons = new Set<string>();
  for (const value of [offer.dateConfirmeeDu, offer.dateConfirmeeAu]) {
    const season = dateToSeason(value);
    if (season) seasons.add(season);
  }
  for (const option of offer.dateOptions ?? []) {
    for (const value of [option.du, option.au]) {
      const season = dateToSeason(value);
      if (season) seasons.add(season);
    }
  }
  return [...seasons];
}

export function GenerateOfferDocTab({
  offer,
  hotelResponses = [],
}: GenerateOfferDocTabProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [excludedResponseIds, setExcludedResponseIds] = useState<Set<string>>(new Set());
  const [destinationMode, setDestinationMode] = useState<OfferPptDestinationMode>("auto");

  useEffect(() => {
    fetchHotels()
      .then(setHotels)
      .catch((err) => setError(err instanceof Error ? err.message : "Impossible de charger les hôtels."));
  }, []);

  const handleIncludedChange = (responseId: string, included: boolean) => {
    setExcludedResponseIds((prev) => {
      const next = new Set(prev);
      if (included) next.delete(responseId);
      else next.add(responseId);
      return next;
    });
  };

  const includedResponses = useMemo(
    () =>
      hotelResponses
        .filter((hotelResponse) => hotelResponse.id)
        .filter((hotelResponse) => hotelResponse.hotelId)
        .filter((hotelResponse) => !excludedResponseIds.has(hotelResponse.id!))
        .filter((hotelResponse) =>
          buildAvailableOfferText(hotelResponse.offerText ?? hotelResponse.message).length > 0
        )
        .map((hotelResponse) => ({
          responseId: hotelResponse.id!,
          hotelId: hotelResponse.hotelId!,
        })),
    [excludedResponseIds, hotelResponses]
  );

  const hotelsById = useMemo(
    () => new Map(hotels.map((hotel) => [hotel.id, hotel])),
    [hotels]
  );

  const offerDestinations = useMemo(
    () => normalizeOfferPptDestinations(offer.stationDemandee),
    [offer.stationDemandee]
  );

  const generationDestinations = useMemo(
    () =>
      resolveOfferPptDestinations({
        mode: destinationMode,
        hotelDestinations: includedResponses.map(
          (hotelResponse) => hotelsById.get(hotelResponse.hotelId)?.destination
        ),
        offerDestination: offer.stationDemandee,
      }),
    [destinationMode, hotelsById, includedResponses, offer.stationDemandee]
  );

  const offerDestinationLabel = formatOfferPptDestinationLabel(offerDestinations);
  const generationDestinationLabel = formatOfferPptDestinationLabel(generationDestinations);
  const destinationDiffers = !areOfferPptDestinationsEqual(offerDestinations, generationDestinations);

  const criteria = useMemo(
    () => ({
      lang: normalizeLangLabel(offer.langue),
      offerDestination: offerDestinationLabel,
      generationDestination: generationDestinationLabel,
      seasons: resolveSeasonLabels(offer),
      hotelsCount: hotelResponses.length,
    }),
    [generationDestinationLabel, offer, offerDestinationLabel, hotelResponses.length]
  );

  const handleGenerate = async () => {
    try {
      setIsGenerating(true);
      setError(null);

      const response = await fetch("/api/generate-offer-ppt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          offerId: offer.id,
          destinationMode,
          responseHotels: includedResponses.map(({ responseId }) => ({ responseId })),
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(
          (data as { error?: string }).error ?? "Erreur lors de la génération."
        );
      }

      const blob = await response.blob();
      const fallbackName = `Offre_${offer.societeContact?.replace(/\s+/g, "_") ?? offer.id}.pptx`;
      const disposition = response.headers.get("Content-Disposition");
      const filename = disposition?.match(/filename="([^"]+)"/)?.[1] ?? fallbackName;
      downloadBlob(blob, filename);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la génération.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">PowerPoint de l&apos;offre</h2>
          <p className="mt-1 text-sm text-slate-500">
            Génère un PPTX depuis le MASTER de la langue de l&apos;offre en gardant uniquement les slides qui correspondent aux tags.
          </p>
        </div>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={isGenerating}
          className="inline-flex items-center justify-center rounded-lg bg-brand-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isGenerating ? "Génération..." : "Télécharger le PPTX"}
        </button>
      </div>

      <div className="mt-5 flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Destination PPT</p>
          <p className="mt-1 text-sm font-medium text-slate-700">{generationDestinationLabel}</p>
        </div>
        <div
          className="grid grid-cols-2 gap-1 rounded-lg bg-white p-1 shadow-sm sm:flex"
          role="group"
          aria-label="Destination PPT"
        >
          {OFFER_PPT_DESTINATION_MODES.map((mode) => {
            const isSelected = destinationMode === mode;
            return (
              <button
                key={mode}
                type="button"
                aria-pressed={isSelected}
                onClick={() => setDestinationMode(mode)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                  isSelected
                    ? "bg-brand-900 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                {DESTINATION_MODE_LABELS[mode]}
              </button>
            );
          })}
        </div>
      </div>

      {destinationDiffers && (
        <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Destination offre : {offerDestinationLabel} · PPT : {generationDestinationLabel}
        </p>
      )}

      <OfferDocumentCriteriaCards
        criteria={criteria}
        includedResponseCount={includedResponses.length}
      />

      <OfferDocumentResponseList
        hotelResponses={hotelResponses}
        hotelsById={hotelsById}
        excludedResponseIds={excludedResponseIds}
        onIncludedChange={handleIncludedChange}
      />

      {error && (
        <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
