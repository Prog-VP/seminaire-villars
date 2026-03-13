"use client";

import {
  DndContext,
  closestCenter,
  type DragEndEvent,
} from "@dnd-kit/core";
import type { SensorDescriptor, SensorOptions } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type { DocumentBlock, HotelDocument } from "../types";
import type { HotelResponse } from "@/features/offres/types";
import type { Hotel } from "@/features/hotels/types";
import {
  DEST_LABELS,
  LANG_LABELS,
  BADGE_COLORS,
  selKey,
  type SelectionItem,
  type DocPick,
} from "./generate-doc-constants";
import { SortableItem } from "./SortableItem";

type DocOrderPanelProps = {
  orderedItems: SelectionItem[];
  blockById: Map<string, DocumentBlock>;
  responseById: Map<string, HotelResponse & { resolvedHotelId: string | null }>;
  responseDocPicks: Record<string, DocPick>;
  hotelsWithDocs: Hotel[];
  hotelDocsByHotelAndLang: Map<string, HotelDocument>;
  langsForHotel: (hotelId: string) => string[];
  sensors: SensorDescriptor<SensorOptions>[];
  handleDragEnd: (event: DragEndEvent) => void;
  removeItem: (item: SelectionItem) => void;
  handleDocPickChange: (responseId: string, field: "hotelId" | "docLang", value: string) => void;
  handleGenerate: () => void;
  isGenerating: boolean;
};

export function DocOrderPanel({
  orderedItems,
  blockById,
  responseById,
  responseDocPicks,
  hotelsWithDocs,
  hotelDocsByHotelAndLang,
  langsForHotel,
  sensors,
  handleDragEnd,
  removeItem,
  handleDocPickChange,
  handleGenerate,
  isGenerating,
}: DocOrderPanelProps) {
  return (
    <div>
      <section className="sticky top-4 rounded-xl border border-white/70 bg-white/90 p-6 shadow-sm ring-1 ring-white/60">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900">
            Ordre du document
          </h3>
          <span className="text-xs text-slate-400">
            {orderedItems.length} élément(s)
          </span>
        </div>

        {orderedItems.length === 0 ? (
          <p className="text-sm text-slate-500">
            Sélectionnez des blocs ou réponses à gauche.
          </p>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={orderedItems.map(selKey)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-1.5">
                {orderedItems.map((item) => {
                  if (item.type === "block") {
                    const block = blockById.get(item.id);
                    if (!block) return null;
                    return (
                      <SortableItem
                        key={selKey(item)}
                        item={item}
                        label={block.name}
                        badges={[
                          {
                            text: DEST_LABELS[block.destination] ?? block.destination,
                            color: BADGE_COLORS[block.destination] ?? "bg-slate-100 text-slate-600",
                          },
                          {
                            text: LANG_LABELS[block.lang] ?? block.lang,
                            color: BADGE_COLORS[block.lang] ?? "bg-slate-100 text-slate-600",
                          },
                        ]}
                        onRemove={() => removeItem(item)}
                      />
                    );
                  }

                  // Response item — with hotel + lang dropdowns
                  const resp = responseById.get(item.id);
                  if (!resp) return null;
                  const pick = responseDocPicks[item.id];
                  const availLangs = pick?.hotelId ? langsForHotel(pick.hotelId) : [];
                  const hasDoc = pick?.hotelId && pick?.docLang
                    ? hotelDocsByHotelAndLang.has(`${pick.hotelId}_${pick.docLang}`)
                    : false;

                  return (
                    <SortableItem
                      key={selKey(item)}
                      item={item}
                      label={resp.hotelName}
                      onRemove={() => removeItem(item)}
                    >
                      <div className="border-t border-slate-100 px-3 py-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <select
                            value={pick?.hotelId ?? ""}
                            onChange={(e) => handleDocPickChange(item.id, "hotelId", e.target.value)}
                            className="flex-1 rounded border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                          >
                            <option value="">Hôtel…</option>
                            {hotelsWithDocs.map((h) => (
                              <option key={h.id} value={h.id}>
                                {h.nom}
                              </option>
                            ))}
                          </select>
                          <select
                            value={pick?.docLang ?? ""}
                            onChange={(e) => handleDocPickChange(item.id, "docLang", e.target.value)}
                            disabled={!pick?.hotelId}
                            className="w-28 rounded border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:opacity-50"
                          >
                            <option value="">Langue…</option>
                            {availLangs.map((l) => (
                              <option key={l} value={l}>
                                {LANG_LABELS[l] ?? l}
                              </option>
                            ))}
                          </select>
                          {hasDoc && (
                            <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                              Doc lié
                            </span>
                          )}
                          {pick?.hotelId && pick?.docLang && !hasDoc && (
                            <span className="text-[10px] text-amber-600">
                              Pas de document
                            </span>
                          )}
                        </div>
                      </div>
                    </SortableItem>
                  );
                })}
              </div>
            </SortableContext>
          </DndContext>
        )}

        {/* Generate button */}
        <div className="mt-6 flex items-center gap-3">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating || orderedItems.length === 0}
            className="rounded-lg bg-gradient-to-r from-brand-900 to-brand-700 px-5 py-2.5 text-sm font-medium text-white transition hover:from-brand-800 hover:to-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isGenerating ? "Génération…" : "Générer le document"}
          </button>
          <span className="text-xs text-slate-400">
            {orderedItems.length} document(s)
          </span>
        </div>
      </section>
    </div>
  );
}
