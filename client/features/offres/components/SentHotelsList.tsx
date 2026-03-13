"use client";

import { useState } from "react";
import type { OfferHotelSend } from "../types";
import { formatDate } from "@/lib/format";

type SentHotelsListProps = {
  sends: OfferHotelSend[];
  shareUrl?: string | null;
  onOpenShareDialog?: () => void;
};

export function SentHotelsList({
  sends,
  shareUrl,
  onOpenShareDialog,
}: SentHotelsListProps) {
  const [linkCopied, setLinkCopied] = useState(false);

  const handleCopyLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      // silent
    }
  };

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Hôtels contactés
          </p>
          <h3 className="text-xl font-semibold text-slate-900">
            {sends.length > 0
              ? `${sends.length} hôtel${sends.length > 1 ? "s" : ""}`
              : "Aucun envoi"}
          </h3>
        </div>
        {onOpenShareDialog && (
          <button
            type="button"
            onClick={onOpenShareDialog}
            className="ml-auto rounded-lg bg-gradient-to-r from-brand-900 to-brand-700 px-3 py-1.5 text-sm font-medium text-white transition hover:from-brand-800 hover:to-brand-600"
          >
            Contacter des hôtels
          </button>
        )}
      </div>

      {/* Share link (always visible if it exists) */}
      {shareUrl && (
        <div className="mt-4">
          <label className="mb-1 block text-xs font-medium text-slate-500">
            Lien de partage
          </label>
          <div className="flex items-center gap-2">
            <input
              readOnly
              value={shareUrl}
              className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-600"
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
      )}

      {sends.length > 0 ? (
        <ul className="mt-4 divide-y divide-slate-100">
          {sends.map((send) => (
            <li
              key={send.id}
              className="flex items-center gap-3 py-2.5"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-900 truncate">
                  {send.hotelName}
                </p>
              </div>
              <span className="shrink-0 text-xs text-slate-500">
                {formatDate(send.sentAt)}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-slate-500">
          Aucun hôtel n&apos;a encore été contacté pour cette offre.
        </p>
      )}
    </section>
  );
}
