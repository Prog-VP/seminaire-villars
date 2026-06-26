import type { Hotel } from "@/features/hotels/types";
import type { HotelResponse } from "@/features/offres/types";

type OfferDocumentResponseListProps = {
  hotelResponses: HotelResponse[];
  responseHotelIds: Record<string, string>;
  responseOfferTexts: Record<string, string>;
  sortedHotels: Hotel[];
  excludedResponseIds: Set<string>;
  duplicateIncludedHotelIds: Set<string>;
  savingHotelIds: Set<string>;
  savingTextIds: Set<string>;
  onHotelChange: (responseId: string, hotelId: string) => void;
  onIncludedChange: (responseId: string, included: boolean) => void;
  onOfferTextChange: (responseId: string, text: string) => void;
  onOfferTextBlur: (responseId: string) => void;
};

export function OfferDocumentResponseList({
  hotelResponses,
  responseHotelIds,
  responseOfferTexts,
  sortedHotels,
  excludedResponseIds,
  duplicateIncludedHotelIds,
  savingHotelIds,
  savingTextIds,
  onHotelChange,
  onIncludedChange,
  onOfferTextChange,
  onOfferTextBlur,
}: OfferDocumentResponseListProps) {
  if (hotelResponses.length === 0) return null;

  return (
    <div className="mt-5 space-y-3">
      {hotelResponses.map((response) => (
        <OfferDocumentResponseCard
          key={response.id ?? response.hotelName}
          response={response}
          responseHotelId={response.id ? responseHotelIds[response.id] : ""}
          responseOfferText={response.id ? responseOfferTexts[response.id] : ""}
          sortedHotels={sortedHotels}
          isIncluded={
            response.id
              ? !excludedResponseIds.has(response.id) && Boolean(responseOfferTexts[response.id]?.trim())
              : false
          }
          isDuplicate={
            Boolean(response.id) &&
            Boolean(response.id && responseHotelIds[response.id]) &&
            Boolean(response.id && duplicateIncludedHotelIds.has(responseHotelIds[response.id]))
          }
          isSavingHotel={Boolean(response.id && savingHotelIds.has(response.id))}
          isSavingText={Boolean(response.id && savingTextIds.has(response.id))}
          onHotelChange={onHotelChange}
          onIncludedChange={onIncludedChange}
          onOfferTextChange={onOfferTextChange}
          onOfferTextBlur={onOfferTextBlur}
        />
      ))}
    </div>
  );
}

function OfferDocumentResponseCard({
  response,
  responseHotelId,
  responseOfferText,
  sortedHotels,
  isIncluded,
  isDuplicate,
  isSavingHotel,
  isSavingText,
  onHotelChange,
  onIncludedChange,
  onOfferTextChange,
  onOfferTextBlur,
}: {
  response: HotelResponse;
  responseHotelId: string;
  responseOfferText: string;
  sortedHotels: Hotel[];
  isIncluded: boolean;
  isDuplicate: boolean;
  isSavingHotel: boolean;
  isSavingText: boolean;
  onHotelChange: (responseId: string, hotelId: string) => void;
  onIncludedChange: (responseId: string, included: boolean) => void;
  onOfferTextChange: (responseId: string, text: string) => void;
  onOfferTextBlur: (responseId: string) => void;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3">
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
              value={responseHotelId}
              onChange={(event) => onHotelChange(response.id!, event.target.value)}
              className="min-w-56 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="">Associer à un hôtel...</option>
              {sortedHotels.map((hotel) => (
                <option key={hotel.id} value={hotel.id}>
                  {hotel.destination ? `${hotel.destination} - ` : ""}
                  {hotel.nom}
                  {hotel.ppt_tag ? ` (${hotel.ppt_tag})` : ""}
                </option>
              ))}
            </select>
            <label className="inline-flex items-center gap-2 whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600">
              <input
                type="checkbox"
                checked={isIncluded}
                onChange={(event) => onIncludedChange(response.id!, event.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-brand-700 focus:ring-brand-500"
              />
              Inclure
            </label>
          </div>
        )}
      </div>

      {response.id && isIncluded && responseHotelId && isDuplicate && (
        <p className="mt-2 rounded-md bg-amber-50 px-2 py-1 text-xs text-amber-700">
          Plusieurs réponses incluses pointent vers le même hôtel. Les slides hôtel seront incluses une seule fois.
        </p>
      )}
      {response.id && isSavingHotel && (
        <p className="mt-1 text-[11px] text-slate-400">Association sauvegardée...</p>
      )}

      {response.id && (
        <div className="mt-3">
          <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-brand-700">
            Texte pour l&apos;offre
          </label>
          <textarea
            value={responseOfferText}
            onChange={(event) => onOfferTextChange(response.id!, event.target.value)}
            onBlur={() => onOfferTextBlur(response.id!)}
            rows={4}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
          <p className="mt-1 text-[11px] text-slate-400">
            {isSavingText
              ? "Sauvegarde..."
              : "Utilisé par {{TEXTE_OFFRE}} sur les slides de l'hôtel associé."}
          </p>
        </div>
      )}
    </div>
  );
}
