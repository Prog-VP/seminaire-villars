"use client";

import { useEffect, useMemo, useState } from "react";
import type { Offer, HotelResponse, OfferHotelSend } from "@/features/offres/types";
import type { Hotel } from "@/features/hotels/types";
import { fetchHotels } from "@/features/hotels/api";
import { saveOfferText, saveResponseHotel } from "@/features/documents/api";
import { buildAvailableOfferText } from "@/features/offres/utils";
import { downloadBlob } from "@/lib/download";
import { OfferDocumentCriteriaCards } from "./OfferDocumentCriteriaCards";
import { OfferDocumentResponseList } from "./OfferDocumentResponseList";

type GenerateOfferDocTabProps = {
  offer: Offer;
  hotelResponses?: HotelResponse[];
  sends?: OfferHotelSend[];
};

function normalizeLangLabel(langue?: string | null) {
  const value = (langue ?? "").toLowerCase();
  if (value.includes("en") || value.includes("anglais")) return "EN";
  if (value.includes("de") || value.includes("allemand")) return "DE";
  return "FR";
}

function normalizeDestinationLabel(destination?: string | null) {
  const value = (destination ?? "").toLowerCase();
  const destinations: string[] = [];
  if (value.includes("villars")) destinations.push("VILLARS");
  if (value.includes("diabler")) destinations.push("DIABLERETS");
  return destinations.length ? destinations.join(", ") : "ALL";
}

function normalizeDestinationKeys(destination?: string | null) {
  const value = (destination ?? "").toLowerCase();
  const destinations: string[] = [];
  if (value.includes("villars")) destinations.push("villars");
  if (value.includes("diabler")) destinations.push("diablerets");
  return destinations;
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
  sends = [],
}: GenerateOfferDocTabProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [responseHotelIds, setResponseHotelIds] = useState<Record<string, string>>({});
  const [responseOfferTexts, setResponseOfferTexts] = useState<Record<string, string>>({});
  const [savingHotelIds, setSavingHotelIds] = useState<Set<string>>(new Set());
  const [savingTextIds, setSavingTextIds] = useState<Set<string>>(new Set());
  const [excludedResponseIds, setExcludedResponseIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchHotels()
      .then(setHotels)
      .catch((err) => setError(err instanceof Error ? err.message : "Impossible de charger les hôtels."));
  }, []);

  useEffect(() => {
    const sendsByHotelName = new Map(
      sends.map((send) => [send.hotelName.trim().toLowerCase(), send.hotelId])
    );
    const nextHotelIds: Record<string, string> = {};
    const nextOfferTexts: Record<string, string> = {};

    for (const response of hotelResponses) {
      if (!response.id) continue;
      nextHotelIds[response.id] =
        response.hotelId ??
        responseHotelIds[response.id] ??
        sendsByHotelName.get(response.hotelName.trim().toLowerCase()) ??
        "";
      nextOfferTexts[response.id] =
        responseOfferTexts[response.id] ??
        buildAvailableOfferText(response.offerText ?? response.message);
    }

    setResponseHotelIds(nextHotelIds);
    setResponseOfferTexts(nextOfferTexts);
  // Preserve local edits while refreshing from the latest response list.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hotelResponses, sends]);

  const handleResponseHotelChange = async (responseId: string, hotelId: string) => {
    setResponseHotelIds((prev) => ({
      ...prev,
      [responseId]: hotelId,
    }));
    setSavingHotelIds((prev) => new Set(prev).add(responseId));
    try {
      await saveResponseHotel(responseId, hotelId || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible d'enregistrer l'association hôtel.");
    } finally {
      setSavingHotelIds((prev) => {
        const next = new Set(prev);
        next.delete(responseId);
        return next;
      });
    }
  };

  const handleOfferTextBlur = async (responseId: string) => {
    const text = responseOfferTexts[responseId] ?? "";
    setSavingTextIds((prev) => new Set(prev).add(responseId));
    try {
      await saveOfferText(responseId, text);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible d'enregistrer le texte pour l'offre.");
    } finally {
      setSavingTextIds((prev) => {
        const next = new Set(prev);
        next.delete(responseId);
        return next;
      });
    }
  };

  const handleIncludedChange = (responseId: string, included: boolean) => {
    setExcludedResponseIds((prev) => {
      const next = new Set(prev);
      if (included) next.delete(responseId);
      else next.add(responseId);
      return next;
    });
  };

  const handleOfferTextChange = (responseId: string, text: string) => {
    setResponseOfferTexts((prev) => ({
      ...prev,
      [responseId]: text,
    }));
  };

  const criteria = useMemo(
    () => ({
      lang: normalizeLangLabel(offer.langue),
      destination: normalizeDestinationLabel(offer.stationDemandee),
      seasons: resolveSeasonLabels(offer),
      hotelsCount: hotelResponses.length,
    }),
    [offer, hotelResponses.length]
  );

  const sortedHotels = useMemo(() => {
    const offerDestinations = normalizeDestinationKeys(offer.stationDemandee);

    return [...hotels].sort((a, b) => {
      const aDestinations = normalizeDestinationKeys(a.destination);
      const bDestinations = normalizeDestinationKeys(b.destination);
      const aMatches = aDestinations.some((destination) => offerDestinations.includes(destination));
      const bMatches = bDestinations.some((destination) => offerDestinations.includes(destination));

      if (aMatches !== bMatches) return aMatches ? -1 : 1;
      const destinationCompare = (aDestinations[0] ?? "").localeCompare(bDestinations[0] ?? "", "fr", {
        sensitivity: "base",
      });
      if (destinationCompare !== 0) return destinationCompare;
      return a.nom.localeCompare(b.nom, "fr", { sensitivity: "base" });
    });
  }, [hotels, offer.stationDemandee]);

  const includedResponseCount = useMemo(
    () =>
      hotelResponses.filter((hotelResponse) => {
        if (!hotelResponse.id || excludedResponseIds.has(hotelResponse.id)) return false;
        return buildAvailableOfferText(responseOfferTexts[hotelResponse.id]).length > 0;
      }).length,
    [excludedResponseIds, hotelResponses, responseOfferTexts]
  );

  const duplicateIncludedHotelIds = useMemo(() => {
    const counts = new Map<string, number>();
    for (const response of hotelResponses) {
      if (!response.id || excludedResponseIds.has(response.id)) continue;
      if (!buildAvailableOfferText(responseOfferTexts[response.id])) continue;
      const hotelId = responseHotelIds[response.id];
      if (!hotelId) continue;
      counts.set(hotelId, (counts.get(hotelId) ?? 0) + 1);
    }
    return new Set([...counts].filter(([, count]) => count > 1).map(([hotelId]) => hotelId));
  }, [excludedResponseIds, hotelResponses, responseHotelIds, responseOfferTexts]);

  const handleGenerate = async () => {
    try {
      setIsGenerating(true);
      setError(null);

      const response = await fetch("/api/generate-offer-ppt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          offerId: offer.id,
          responseHotels: hotelResponses
            .filter((hotelResponse) => hotelResponse.id)
            .filter((hotelResponse) => !excludedResponseIds.has(hotelResponse.id!))
            .map((hotelResponse) => {
              const responseId = hotelResponse.id!;
              return {
                responseId,
                hotelId: responseHotelIds[responseId] || null,
                offerText: buildAvailableOfferText(
                  responseOfferTexts[responseId] ?? hotelResponse.offerText ?? hotelResponse.message,
                ),
              };
            })
            .filter((hotelResponse) => hotelResponse.offerText.length > 0),
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

      <OfferDocumentCriteriaCards
        criteria={criteria}
        includedResponseCount={includedResponseCount}
      />

      <OfferDocumentResponseList
        hotelResponses={hotelResponses}
        responseHotelIds={responseHotelIds}
        responseOfferTexts={responseOfferTexts}
        sortedHotels={sortedHotels}
        excludedResponseIds={excludedResponseIds}
        duplicateIncludedHotelIds={duplicateIncludedHotelIds}
        savingHotelIds={savingHotelIds}
        savingTextIds={savingTextIds}
        onHotelChange={(responseId, hotelId) => void handleResponseHotelChange(responseId, hotelId)}
        onIncludedChange={handleIncludedChange}
        onOfferTextChange={handleOfferTextChange}
        onOfferTextBlur={(responseId) => void handleOfferTextBlur(responseId)}
      />

      {error && (
        <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
