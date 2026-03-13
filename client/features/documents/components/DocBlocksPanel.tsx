"use client";

import type { DocumentBlock } from "../types";
import type { HotelResponse } from "@/features/offres/types";
import {
  DEST_LABELS,
  SEASON_LABELS,
  LANG_LABELS,
  BADGE_COLORS,
} from "./generate-doc-constants";

type DocBlocksPanelProps = {
  blocks: DocumentBlock[];
  filteredBlocks: DocumentBlock[];
  grouped: { destination: string; season: string; blocks: DocumentBlock[] }[];
  selectedBlockIds: string[];
  selectedBlockSet: Set<string>;
  toggleBlock: (id: string) => void;
  // Hotel responses
  hotelResponses: HotelResponse[];
  responsesWithHotelId: (HotelResponse & { resolvedHotelId: string | null })[];
  selectedResponseIds: string[];
  selectedResponseSet: Set<string>;
  toggleResponse: (id: string) => void;
  localOfferTexts: Record<string, string>;
  handleOfferTextChange: (responseId: string, text: string) => void;
};

export function DocBlocksPanel({
  blocks,
  filteredBlocks,
  grouped,
  selectedBlockIds,
  selectedBlockSet,
  toggleBlock,
  hotelResponses,
  responsesWithHotelId,
  selectedResponseIds,
  selectedResponseSet,
  toggleResponse,
  localOfferTexts,
  handleOfferTextChange,
}: DocBlocksPanelProps) {
  return (
    <div className="space-y-6">
      {/* Document blocks */}
      <section className="rounded-xl border border-white/70 bg-white/90 p-6 shadow-sm ring-1 ring-white/60">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900">
            Blocs documents
          </h3>
          <span className="text-xs text-slate-400">
            {selectedBlockIds.length}/{blocks.length} sélectionné(s)
          </span>
        </div>
        {blocks.length === 0 ? (
          <p className="text-sm text-slate-500">
            Aucun bloc document configuré.
          </p>
        ) : filteredBlocks.length === 0 ? (
          <p className="text-sm text-slate-500">
            Aucun bloc ne correspond aux filtres.
          </p>
        ) : (
          <div className="space-y-4">
            {grouped.map(({ destination, season, blocks: groupBlks }) => (
              <div key={`${destination}-${season}`}>
                <div className="mb-1.5 flex items-center gap-2">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${BADGE_COLORS[destination] ?? "bg-slate-100 text-slate-600"}`}
                  >
                    {DEST_LABELS[destination] ?? destination}
                  </span>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${BADGE_COLORS[season] ?? "bg-slate-100 text-slate-600"}`}
                  >
                    {SEASON_LABELS[season] ?? season}
                  </span>
                </div>
                <div className="space-y-0.5">
                  {groupBlks.map((block) => (
                    <label
                      key={block.id}
                      className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 transition hover:bg-slate-50"
                    >
                      <input
                        type="checkbox"
                        checked={selectedBlockSet.has(block.id)}
                        onChange={() => toggleBlock(block.id)}
                        className="h-4 w-4 rounded border-slate-300 text-brand-900 focus:ring-brand-900"
                      />
                      <span className="text-sm text-slate-700">
                        {block.name}
                      </span>
                      <span
                        className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium ${BADGE_COLORS[block.lang] ?? "bg-slate-100 text-slate-600"}`}
                      >
                        {LANG_LABELS[block.lang] ?? block.lang}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Hotel responses */}
      <section className="rounded-xl border border-white/70 bg-white/90 p-6 shadow-sm ring-1 ring-white/60">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900">Réponses hôtels</h3>
          <span className="text-xs text-slate-400">
            {selectedResponseIds.length}/{hotelResponses.length} sélectionné(s)
          </span>
        </div>
        {hotelResponses.length === 0 ? (
          <p className="text-sm text-slate-500">Aucune réponse hôtel pour cette offre.</p>
        ) : (
          <div className="space-y-2">
            {responsesWithHotelId.map((response) => {
              if (!response.id) return null;
              const isSelected = selectedResponseSet.has(response.id);
              const displayText =
                localOfferTexts[response.id] ??
                response.offerText ??
                response.message;

              return (
                <div key={response.id} className="rounded-lg border border-slate-100 bg-slate-50/50">
                  <label className="flex cursor-pointer items-center gap-3 px-3 py-2.5">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleResponse(response.id!)}
                      className="h-4 w-4 rounded border-slate-300 text-brand-900 focus:ring-brand-900"
                    />
                    <span className="text-sm font-medium text-slate-900">
                      {response.hotelName}
                    </span>
                    {response.respondentName && (
                      <span className="text-xs text-slate-400">
                        ({response.respondentName})
                      </span>
                    )}
                  </label>

                  {isSelected && (
                    <div className="border-t border-slate-100 px-3 py-3">
                      <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-brand-700">
                        Texte pour l&apos;offre
                      </label>
                      <textarea
                        value={displayText}
                        onChange={(e) => handleOfferTextChange(response.id!, e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                        rows={5}
                      />
                      <p className="mt-1 text-[11px] text-slate-400">
                        Sauvegarde automatique.
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
