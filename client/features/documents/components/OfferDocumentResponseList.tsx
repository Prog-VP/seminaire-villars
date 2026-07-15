import type { Hotel } from "@/features/hotels/types";
import type { HotelResponse } from "@/features/offres/types";
import { buildAvailableOfferText } from "@/features/offres/utils";

type OfferDocumentResponseListProps = {
  hotelResponses: HotelResponse[];
  hotelsById: Map<string, Hotel>;
  excludedResponseIds: Set<string>;
  onIncludedChange: (responseId: string, included: boolean) => void;
};

export function OfferDocumentResponseList({
  hotelResponses,
  hotelsById,
  excludedResponseIds,
  onIncludedChange,
}: OfferDocumentResponseListProps) {
  if (hotelResponses.length === 0) return null;

  return (
    <div className="mt-5 space-y-3">
      {hotelResponses.map((response) => (
        <OfferDocumentResponseCard
          key={response.id ?? response.hotelName}
          response={response}
          associatedHotel={response.hotelId ? hotelsById.get(response.hotelId) ?? null : null}
          isIncluded={
            response.id
              ? !excludedResponseIds.has(response.id) &&
                Boolean(response.hotelId) &&
                buildAvailableOfferText(response.offerText ?? response.message).length > 0
              : false
          }
          onIncludedChange={onIncludedChange}
        />
      ))}
    </div>
  );
}

function OfferDocumentResponseCard({
  response,
  associatedHotel,
  isIncluded,
  onIncludedChange,
}: {
  response: HotelResponse;
  associatedHotel: Hotel | null;
  isIncluded: boolean;
  onIncludedChange: (responseId: string, included: boolean) => void;
}) {
  const hasOfferText = buildAvailableOfferText(response.offerText ?? response.message).length > 0;
  const canInclude = Boolean(response.id && associatedHotel && hasOfferText);

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
            <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
              {associatedHotel ? (
                <>
                  <span className="font-semibold text-slate-800">{associatedHotel.nom}</span>
                  {associatedHotel.destination && <span> · {associatedHotel.destination}</span>}
                  {associatedHotel.ppt_tag && <span> · {associatedHotel.ppt_tag}</span>}
                </>
              ) : (
                <span className="font-semibold text-amber-700">Hôtel non associé</span>
              )}
            </div>
            <label className="inline-flex items-center gap-2 whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600">
              <input
                type="checkbox"
                checked={isIncluded}
                disabled={!canInclude}
                onChange={(event) => onIncludedChange(response.id!, event.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-brand-700 focus:ring-brand-500 disabled:cursor-not-allowed disabled:opacity-50"
              />
              Inclure
            </label>
          </div>
        )}
      </div>

      {response.id && !associatedHotel && (
        <p className="mt-2 rounded-md bg-amber-50 px-2 py-1 text-xs text-amber-700">
          Associez cette réponse à un hôtel dans l&apos;onglet Hôtels avant de l&apos;inclure.
        </p>
      )}
      {response.id && associatedHotel && !hasOfferText && (
        <p className="mt-2 rounded-md bg-amber-50 px-2 py-1 text-xs text-amber-700">
          Ajoutez un texte pour l&apos;offre dans l&apos;onglet Réponses avant de l&apos;inclure.
        </p>
      )}
    </div>
  );
}
