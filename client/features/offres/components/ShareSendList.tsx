"use client";

import type { Hotel } from "@/features/hotels/types";

type Props = {
  selectedHotels: Hotel[];
  sentInSession: Set<string>;
  handleSendOne: (hotel: Hotel) => void;
  onBack: () => void;
  onClose: () => void;
};

export function ShareSendList({
  selectedHotels,
  sentInSession,
  handleSendOne,
  onBack,
  onClose,
}: Props) {
  return (
    <>
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="mb-4">
          <p className="text-sm font-medium text-slate-700">
            {selectedHotels.length} hôtel{selectedHotels.length > 1 ? "s" : ""} sélectionné{selectedHotels.length > 1 ? "s" : ""}
          </p>
        </div>

        <div className="space-y-2">
          {selectedHotels.map((hotel) => {
            const wasSent = sentInSession.has(hotel.id);
            return (
              <div
                key={hotel.id}
                className="flex items-center gap-3 rounded-lg border border-slate-200 px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {hotel.nom}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    {hotel.email}
                  </p>
                </div>
                {wasSent ? (
                  <span className="inline-flex items-center gap-1 text-sm font-medium text-emerald-600">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Envoyé
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSendOne(hotel)}
                    className="rounded-lg border border-brand-200 bg-brand-50 px-3 py-1.5 text-sm font-medium text-brand-900 transition hover:bg-brand-100"
                  >
                    Envoyer
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-slate-100 px-6 py-3">
        <button
          type="button"
          onClick={onBack}
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
        >
          ← Retour
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
        >
          Fermer
        </button>
      </div>
    </>
  );
}
