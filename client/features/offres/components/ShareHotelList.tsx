"use client";

import type { Hotel } from "@/features/hotels/types";
import type { OfferHotelSend } from "../types";

type Props = {
  hotels: Hotel[];
  filteredHotels: Hotel[];
  search: string;
  setSearch: (v: string) => void;
  destinationFilter: string | null;
  setDestinationFilter: (v: string | null) => void;
  destinations: string[];
  selected: Set<string>;
  sentInSession: Set<string>;
  sendsByHotelId: Map<string, OfferHotelSend>;
  isAllNewSelected: boolean;
  toggleHotel: (id: string) => void;
  toggleSelectAll: () => void;
  shareUrl: string | null;
  linkCopied: boolean;
  handleCopyLink: () => void;
  onNext: () => void;
  onClose: () => void;
};

export function ShareHotelList({
  hotels,
  filteredHotels,
  search,
  setSearch,
  destinationFilter,
  setDestinationFilter,
  destinations,
  selected,
  sentInSession,
  sendsByHotelId,
  isAllNewSelected,
  toggleHotel,
  toggleSelectAll,
  shareUrl,
  linkCopied,
  handleCopyLink,
  onNext,
  onClose,
}: Props) {
  return (
    <>
      {/* Share link */}
      <div className="border-b border-slate-100 px-6 py-3">
        <label className="mb-1 block text-xs font-medium text-slate-500">
          Lien de partage
        </label>
        <div className="flex items-center gap-2">
          <input
            readOnly
            value={shareUrl ?? ""}
            className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-700"
            onClick={(e) => (e.target as HTMLInputElement).select()}
          />
          <button
            type="button"
            onClick={handleCopyLink}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
          >
            {linkCopied ? "Copié !" : "Copier"}
          </button>
        </div>
      </div>

      {/* Hotel list */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {hotels.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
            <p className="text-sm text-slate-600">
              Aucun hôtel enregistré.
            </p>
            <a
              href="/reglages/hotels"
              className="mt-2 inline-block text-sm font-medium text-brand-900 hover:underline"
            >
              Ajouter des hôtels →
            </a>
          </div>
        ) : (
          <>
            {/* Destination filter + Search */}
            {destinations.length > 1 && (
              <div className="mb-3 flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setDestinationFilter(null)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                    destinationFilter === null
                      ? "bg-brand-900 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  Tous
                </button>
                {destinations.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDestinationFilter(d === destinationFilter ? null : d)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                      destinationFilter === d
                        ? "bg-brand-900 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            )}

            <div className="mb-3 flex items-center gap-3">
              <input
                type="text"
                placeholder="Rechercher un hôtel..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-700 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
              />
              <label className="flex items-center gap-1.5 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={isAllNewSelected}
                  onChange={toggleSelectAll}
                  className="h-4 w-4 rounded border-slate-300 text-brand-900 focus:ring-brand-900"
                />
                Tout
              </label>
            </div>

            {/* List */}
            <div className="space-y-1">
              {filteredHotels.map((hotel) => {
                const send = sendsByHotelId.get(hotel.id);
                const hasEmail = !!hotel.email;
                const wasSentInSession = sentInSession.has(hotel.id);
                const isChecked = selected.has(hotel.id);

                return (
                  <label
                    key={hotel.id}
                    className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 transition ${
                      !hasEmail
                        ? "cursor-not-allowed border-slate-100 bg-slate-50 opacity-50"
                        : isChecked
                          ? "border-brand-200 bg-brand-50"
                          : "cursor-pointer border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="checkbox"
                      disabled={!hasEmail}
                      checked={isChecked}
                      onChange={() => toggleHotel(hotel.id)}
                      className="h-4 w-4 rounded border-slate-300 text-brand-900 focus:ring-brand-900 disabled:opacity-40"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {hotel.nom}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {hotel.email || "Pas d'email"}
                      </p>
                    </div>
                    {(send || wasSentInSession) && (
                      <span className="shrink-0 inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                        Envoyé le{" "}
                        {new Date(
                          wasSentInSession && !send
                            ? new Date().toISOString()
                            : send!.sentAt
                        ).toLocaleDateString("fr-CH")}
                      </span>
                    )}
                  </label>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      {hotels.length > 0 && (
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
            onClick={onNext}
            disabled={selected.size === 0}
            className="rounded-lg bg-gradient-to-r from-brand-900 to-brand-700 px-4 py-2 text-sm font-medium text-white transition hover:from-brand-800 hover:to-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Préparer les emails ({selected.size})
          </button>
        </div>
      )}
    </>
  );
}
