"use client";

import { useEffect, useMemo, useState } from "react";
import type { Offer, HotelResponse, OfferHotelSend } from "@/features/offres/types";
import type { Hotel } from "@/features/hotels/types";
import { fetchHotels } from "@/features/hotels/api";
import { saveOfferText, saveResponseHotel } from "@/features/documents/api";
import { downloadBlob } from "@/lib/download";

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
        response.offerText ??
        response.message ??
        "";
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
      hotelResponses.filter((hotelResponse) => hotelResponse.id && !excludedResponseIds.has(hotelResponse.id)).length,
    [excludedResponseIds, hotelResponses]
  );

  const duplicateIncludedHotelIds = useMemo(() => {
    const counts = new Map<string, number>();
    for (const response of hotelResponses) {
      if (!response.id || excludedResponseIds.has(response.id)) continue;
      const hotelId = responseHotelIds[response.id];
      if (!hotelId) continue;
      counts.set(hotelId, (counts.get(hotelId) ?? 0) + 1);
    }
    return new Set([...counts].filter(([, count]) => count > 1).map(([hotelId]) => hotelId));
  }, [excludedResponseIds, hotelResponses, responseHotelIds]);

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
            .map((hotelResponse) => ({
              responseId: hotelResponse.id!,
              hotelId: responseHotelIds[hotelResponse.id!] || null,
              offerText: responseOfferTexts[hotelResponse.id!] ?? hotelResponse.offerText ?? hotelResponse.message ?? "",
            })),
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
            Génère un PPTX depuis le MASTER en gardant uniquement les slides qui correspondent aux tags de cette offre.
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

      <div className="mt-5 grid gap-3 text-sm sm:grid-cols-4">
        <div className="rounded-lg bg-slate-50 px-3 py-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Langue</p>
          <p className="mt-1 font-medium text-slate-700">{criteria.lang}</p>
        </div>
        <div className="rounded-lg bg-slate-50 px-3 py-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Destination</p>
          <p className="mt-1 font-medium text-slate-700">{criteria.destination}</p>
        </div>
        <div className="rounded-lg bg-slate-50 px-3 py-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Saison</p>
          <p className="mt-1 font-medium text-slate-700">
            {criteria.seasons.length ? criteria.seasons.join(", ") : "ALL"}
          </p>
        </div>
        <div className="rounded-lg bg-slate-50 px-3 py-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Hôtels inclus</p>
          <p className="mt-1 font-medium text-slate-700">{includedResponseCount} / {criteria.hotelsCount}</p>
        </div>
      </div>

      {hotelResponses.length > 0 && (
        <div className="mt-5 space-y-3">
          {hotelResponses.map((response) => (
            <div key={response.id ?? response.hotelName} className="rounded-lg border border-slate-200 bg-slate-50/70 p-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900">
                    Réponse de {response.hotelName}
                  </p>
                  {response.respondentName && (
                    <p className="text-xs text-slate-500">{response.respondentName}</p>
                  )}
                </div>
                {response.id && (
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <select
                      value={responseHotelIds[response.id] ?? ""}
                      onChange={(e) => void handleResponseHotelChange(response.id!, e.target.value)}
                      className="min-w-56 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    >
                      <option value="">Associer à un hôtel...</option>
                      {sortedHotels.map((hotel) => (
                        <option key={hotel.id} value={hotel.id}>
                          {hotel.destination ? `${hotel.destination} - ` : ""}{hotel.nom}{hotel.ppt_tag ? ` (${hotel.ppt_tag})` : ""}
                        </option>
                      ))}
                    </select>
                    <label className="inline-flex items-center gap-2 whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600">
                      <input
                        type="checkbox"
                        checked={!excludedResponseIds.has(response.id)}
                        onChange={(event) => {
                          const checked = event.target.checked;
                          setExcludedResponseIds((prev) => {
                            const next = new Set(prev);
                            if (checked) next.delete(response.id!);
                            else next.add(response.id!);
                            return next;
                          });
                        }}
                        className="h-4 w-4 rounded border-slate-300 text-brand-700 focus:ring-brand-500"
                      />
                      Inclure
                    </label>
                  </div>
                )}
              </div>
              {response.id &&
                !excludedResponseIds.has(response.id) &&
                responseHotelIds[response.id] &&
                duplicateIncludedHotelIds.has(responseHotelIds[response.id]) && (
                  <p className="mt-2 rounded-md bg-amber-50 px-2 py-1 text-xs text-amber-700">
                    Plusieurs réponses incluses pointent vers le même hôtel. Les slides hôtel seront incluses une seule fois.
                  </p>
                )}
              {response.id && savingHotelIds.has(response.id) && (
                <p className="mt-1 text-[11px] text-slate-400">Association sauvegardée...</p>
              )}

              {response.id && (
                <div className="mt-3">
                  <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-brand-700">
                    Texte pour l&apos;offre
                  </label>
                  <textarea
                    value={responseOfferTexts[response.id] ?? ""}
                    onChange={(e) =>
                      setResponseOfferTexts((prev) => ({
                        ...prev,
                        [response.id!]: e.target.value,
                      }))
                    }
                    onBlur={() => void handleOfferTextBlur(response.id!)}
                    rows={4}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                  <p className="mt-1 text-[11px] text-slate-400">
                    {savingTextIds.has(response.id)
                      ? "Sauvegarde..."
                      : "Utilisé par {{TEXTE_OFFRE}} sur les slides de l'hôtel associé."}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {error && (
        <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
