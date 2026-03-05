"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Offer, HotelResponse, OfferHotelSend } from "@/features/offres/types";
import type { DocumentBlock, HotelDocument } from "../types";
import type { Hotel } from "@/features/hotels/types";
import { fetchHotels } from "@/features/hotels/api";
import { downloadBlob } from "@/lib/download";
import {
  fetchDocumentBlocks,
  fetchAllHotelDocuments,
  fetchOfferSelections,
  fetchOfferTexts,
  addOfferSelection,
  removeOfferSelection,
  updateSelectionOrder,
  updateResponseHotelDoc,
  saveOfferText,
} from "../api";

type GenerateOfferDocTabProps = {
  offer: Offer;
  hotelResponses?: HotelResponse[];
  sends?: OfferHotelSend[];
};

const SEASON_LABELS: Record<string, string> = {
  ete: "Été",
  hiver: "Hiver",
};

const LANG_LABELS: Record<string, string> = {
  fr: "Français",
  en: "English",
  de: "Deutsch",
};

const DEST_LABELS: Record<string, string> = {
  villars: "Villars-sur-Ollon",
  diablerets: "Les Diablerets",
};

const BADGE_COLORS: Record<string, string> = {
  villars: "bg-blue-100 text-blue-700",
  diablerets: "bg-purple-100 text-purple-700",
  ete: "bg-amber-100 text-amber-700",
  hiver: "bg-sky-100 text-sky-700",
  fr: "bg-slate-100 text-slate-600",
  en: "bg-rose-100 text-rose-600",
  de: "bg-emerald-100 text-emerald-600",
};

function normalizeLang(langue?: string | null): string {
  if (!langue) return "fr";
  const lower = langue.toLowerCase();
  if (lower.includes("en") || lower.includes("anglais")) return "en";
  if (lower.includes("de") || lower.includes("allemand")) return "de";
  return "fr";
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SelectionItem =
  | { type: "block"; id: string }
  | { type: "response"; id: string };

function selKey(item: SelectionItem): string {
  return `${item.type}:${item.id}`;
}

type DocPick = { hotelId: string; docLang: string };

// ---------------------------------------------------------------------------
// Sortable item component
// ---------------------------------------------------------------------------

function SortableItem({
  item,
  label,
  badges,
  onRemove,
  children,
}: {
  item: SelectionItem;
  label: string;
  badges?: { text: string; color: string }[];
  onRemove: () => void;
  children?: React.ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: selKey(item) });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="rounded-lg border border-slate-200 bg-white shadow-sm"
    >
      <div className="flex items-center gap-2 px-3 py-2">
        <button
          type="button"
          className="cursor-grab touch-none text-slate-400 hover:text-slate-600"
          {...attributes}
          {...listeners}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <circle cx="5" cy="3" r="1.5" />
            <circle cx="11" cy="3" r="1.5" />
            <circle cx="5" cy="8" r="1.5" />
            <circle cx="11" cy="8" r="1.5" />
            <circle cx="5" cy="13" r="1.5" />
            <circle cx="11" cy="13" r="1.5" />
          </svg>
        </button>
        <span className="text-xs font-medium uppercase text-slate-400">
          {item.type === "block" ? "Bloc" : "Hôtel"}
        </span>
        <span className="flex-1 truncate text-sm text-slate-700">{label}</span>
        {badges?.map((b) => (
          <span
            key={b.text}
            className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium ${b.color}`}
          >
            {b.text}
          </span>
        ))}
        <button
          type="button"
          onClick={onRemove}
          className="ml-1 text-slate-300 hover:text-red-500"
          title="Retirer"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 3l8 8M11 3l-8 8" />
          </svg>
        </button>
      </div>
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function GenerateOfferDocTab({
  offer,
  hotelResponses = [],
  sends = [],
}: GenerateOfferDocTabProps) {
  const [blocks, setBlocks] = useState<DocumentBlock[]>([]);
  const [hotelDocs, setHotelDocs] = useState<HotelDocument[]>([]);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Lang derived from offer
  const lang = normalizeLang(offer.langue);

  // Selections as ordered arrays
  const [selectedBlockIds, setSelectedBlockIds] = useState<string[]>([]);
  const [selectedResponseIds, setSelectedResponseIds] = useState<string[]>([]);

  // Unified ordered list for DnD
  const [orderedItems, setOrderedItems] = useState<SelectionItem[]>([]);

  // Hotel doc picks per response (persisted via hotel_document_id)
  const [responseDocPicks, setResponseDocPicks] = useState<Record<string, DocPick>>({});

  // Filters (non-blocking) — all empty = show everything by default
  const [filterDest, setFilterDest] = useState("");
  const [filterSeason, setFilterSeason] = useState("");
  const [filterLang, setFilterLang] = useState("");

  // Local offer texts for inline editing
  const [localOfferTexts, setLocalOfferTexts] = useState<Record<string, string>>({});

  // Debounced auto-save for offer texts (direct DB save, bypasses parent guards)
  const saveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const scheduleTextSave = useCallback((responseId: string, text: string) => {
    clearTimeout(saveTimers.current[responseId]);
    saveTimers.current[responseId] = setTimeout(() => {
      void saveOfferText(responseId, text);
    }, 600);
  }, []);

  // Flush all pending saves on unmount
  useEffect(() => {
    return () => {
      for (const timer of Object.values(saveTimers.current)) {
        clearTimeout(timer);
      }
      // Save any pending texts immediately
      const texts = localOfferTextsRef.current;
      for (const [responseId, text] of Object.entries(texts)) {
        void saveOfferText(responseId, text);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const localOfferTextsRef = useRef(localOfferTexts);
  localOfferTextsRef.current = localOfferTexts;

  // Generate state
  const [isGenerating, setIsGenerating] = useState(false);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const load = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [blocksData, hotelDocsData, hotelsData, selections, offerTexts] = await Promise.all([
        fetchDocumentBlocks(),
        fetchAllHotelDocuments(),
        fetchHotels(),
        fetchOfferSelections(offer.id),
        fetchOfferTexts(offer.id),
      ]);
      setBlocks(blocksData);
      setHotelDocs(hotelDocsData);
      setHotels(hotelsData);
      setSelectedBlockIds(selections.blockIds);
      setSelectedResponseIds(selections.responseIds);
      setLocalOfferTexts(offerTexts);

      // Restore responseDocPicks from persisted hotel_document_id
      const picks: Record<string, DocPick> = {};
      for (const [responseId, hotelDocId] of Object.entries(selections.responseHotelDocMap)) {
        const doc = hotelDocsData.find((d) => d.id === hotelDocId);
        if (doc) {
          picks[responseId] = { hotelId: doc.hotelId, docLang: doc.lang };
        }
      }
      setResponseDocPicks(picks);

      // Use ordered items from the API (already sorted by sort_order)
      setOrderedItems(selections.orderedItems);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Impossible de charger les données."
      );
    } finally {
      setIsLoading(false);
    }
  }, [offer.id]);

  useEffect(() => {
    void load();
  }, [load]);

  // Build hotelName → hotelId mapping from sends
  const hotelNameToId = useMemo(() => {
    const map = new Map<string, string>();
    for (const send of sends) {
      map.set(send.hotelName.toLowerCase(), send.hotelId);
    }
    return map;
  }, [sends]);

  // Hotel doc lookup by hotelId_lang → HotelDocument
  const hotelDocsByHotelAndLang = useMemo(() => {
    const map = new Map<string, HotelDocument>();
    for (const doc of hotelDocs) {
      map.set(`${doc.hotelId}_${doc.lang}`, doc);
    }
    return map;
  }, [hotelDocs]);

  // Hotels that have at least one document
  const hotelsWithDocs = useMemo(() => {
    const idsWithDocs = new Set(hotelDocs.map((d) => d.hotelId));
    return hotels.filter((h) => idsWithDocs.has(h.id));
  }, [hotels, hotelDocs]);

  // Available languages per hotel (from their documents)
  const langsForHotel = useCallback(
    (hotelId: string): string[] => {
      return hotelDocs
        .filter((d) => d.hotelId === hotelId)
        .map((d) => d.lang);
    },
    [hotelDocs]
  );

  // Resolve hotelId for each response (auto from sends)
  const responsesWithHotelId = useMemo(
    () =>
      hotelResponses.map((r) => {
        const resolvedHotelId = hotelNameToId.get(r.hotelName.toLowerCase()) ?? null;
        return { ...r, resolvedHotelId };
      }),
    [hotelResponses, hotelNameToId]
  );

  // Lookups
  const blockById = useMemo(() => {
    const map = new Map<string, DocumentBlock>();
    for (const b of blocks) map.set(b.id, b);
    return map;
  }, [blocks]);

  const responseById = useMemo(() => {
    const map = new Map<string, (typeof responsesWithHotelId)[number]>();
    for (const r of responsesWithHotelId) {
      if (r.id) map.set(r.id, r);
    }
    return map;
  }, [responsesWithHotelId]);

  // Unique values for filters
  const destinations = useMemo(() => [...new Set(blocks.map((b) => b.destination))], [blocks]);
  const seasons = useMemo(() => [...new Set(blocks.map((b) => b.season))], [blocks]);
  const langs = useMemo(() => [...new Set(blocks.map((b) => b.lang))], [blocks]);

  // Filtered blocks
  const filteredBlocks = useMemo(() => {
    return blocks.filter((b) => {
      if (filterDest && b.destination !== filterDest) return false;
      if (filterSeason && b.season !== filterSeason) return false;
      if (filterLang && b.lang !== filterLang) return false;
      return true;
    });
  }, [blocks, filterDest, filterSeason, filterLang]);

  // Grouped filtered blocks
  const grouped = useMemo(() => {
    const map = new Map<string, DocumentBlock[]>();
    for (const b of filteredBlocks) {
      const key = `${b.destination}|${b.season}`;
      const arr = map.get(key);
      if (arr) arr.push(b);
      else map.set(key, [b]);
    }
    const groups: { destination: string; season: string; blocks: DocumentBlock[] }[] = [];
    for (const [key, items] of map) {
      const [destination, season] = key.split("|");
      groups.push({ destination, season, blocks: items });
    }
    return groups;
  }, [filteredBlocks]);

  // Sets for quick lookup
  const selectedBlockSet = useMemo(() => new Set(selectedBlockIds), [selectedBlockIds]);
  const selectedResponseSet = useMemo(() => new Set(selectedResponseIds), [selectedResponseIds]);

  // Persist order helper
  const persistOrder = useCallback(
    (items: SelectionItem[]) => {
      void updateSelectionOrder(
        offer.id,
        items.map((item, i) => ({
          blockId: item.type === "block" ? item.id : undefined,
          responseId: item.type === "response" ? item.id : undefined,
          sortOrder: i,
        }))
      );
    },
    [offer.id]
  );

  // Auto-fill doc pick when a response is first selected
  const autoPickForResponse = useCallback(
    (responseId: string): DocPick | null => {
      const resp = responsesWithHotelId.find((r) => r.id === responseId);
      if (!resp?.resolvedHotelId) return null;
      const availLangs = langsForHotel(resp.resolvedHotelId);
      if (availLangs.length === 0) return null;
      // Prefer offer language, fallback to first available
      const docLang = availLangs.includes(lang) ? lang : availLangs[0];
      return { hotelId: resp.resolvedHotelId, docLang };
    },
    [responsesWithHotelId, langsForHotel, lang]
  );

  // Resolve hotel_document_id from a pick
  const resolveDocId = useCallback(
    (pick: DocPick): string | null => {
      const doc = hotelDocsByHotelAndLang.get(`${pick.hotelId}_${pick.docLang}`);
      return doc?.id ?? null;
    },
    [hotelDocsByHotelAndLang]
  );

  const toggleBlock = (id: string) => {
    const isSelected = selectedBlockSet.has(id);
    if (isSelected) {
      setSelectedBlockIds((prev) => prev.filter((x) => x !== id));
      setOrderedItems((prev) => {
        const next = prev.filter((x) => !(x.type === "block" && x.id === id));
        persistOrder(next);
        return next;
      });
      void removeOfferSelection(offer.id, { blockId: id });
    } else {
      const newItem: SelectionItem = { type: "block", id };
      setSelectedBlockIds((prev) => [...prev, id]);
      setOrderedItems((prev) => {
        const next = [...prev, newItem];
        void addOfferSelection(offer.id, { blockId: id }, next.length - 1);
        return next;
      });
    }
  };

  const toggleResponse = (id: string) => {
    const isSelected = selectedResponseSet.has(id);
    if (isSelected) {
      setSelectedResponseIds((prev) => prev.filter((x) => x !== id));
      setOrderedItems((prev) => {
        const next = prev.filter((x) => !(x.type === "response" && x.id === id));
        persistOrder(next);
        return next;
      });
      setResponseDocPicks((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      void removeOfferSelection(offer.id, { responseId: id });
    } else {
      const newItem: SelectionItem = { type: "response", id };
      setSelectedResponseIds((prev) => [...prev, id]);

      // Auto-fill hotel+lang
      const autoPick = autoPickForResponse(id);
      const hotelDocId = autoPick ? resolveDocId(autoPick) : null;

      if (autoPick) {
        setResponseDocPicks((prev) => ({ ...prev, [id]: autoPick }));
      }

      setOrderedItems((prev) => {
        const next = [...prev, newItem];
        void addOfferSelection(offer.id, { responseId: id }, next.length - 1, hotelDocId);
        return next;
      });
    }
  };

  const handleDocPickChange = (responseId: string, field: "hotelId" | "docLang", value: string) => {
    setResponseDocPicks((prev) => {
      const current = prev[responseId] ?? { hotelId: "", docLang: lang };
      const updated = { ...current, [field]: value };

      // If hotel changed, reset lang to best match
      if (field === "hotelId" && value) {
        const availLangs = langsForHotel(value);
        if (!availLangs.includes(updated.docLang)) {
          updated.docLang = availLangs.includes(lang) ? lang : (availLangs[0] ?? "");
        }
      }

      // Persist to DB
      const docId = updated.hotelId && updated.docLang
        ? resolveDocId(updated)
        : null;
      void updateResponseHotelDoc(offer.id, responseId, docId);

      return { ...prev, [responseId]: updated };
    });
  };

  const removeItem = (item: SelectionItem) => {
    if (item.type === "block") toggleBlock(item.id);
    else toggleResponse(item.id);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setOrderedItems((prev) => {
      const oldIndex = prev.findIndex((x) => selKey(x) === active.id);
      const newIndex = prev.findIndex((x) => selKey(x) === over.id);
      if (oldIndex === -1 || newIndex === -1) return prev;
      const next = arrayMove(prev, oldIndex, newIndex);
      persistOrder(next);
      return next;
    });
  };

  const handleOfferTextChange = (responseId: string, text: string) => {
    setLocalOfferTexts((prev) => ({ ...prev, [responseId]: text }));
    scheduleTextSave(responseId, text);
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const items: { type: "block" | "hotel"; filePath: string; offerText?: string }[] = [];

      for (const item of orderedItems) {
        if (item.type === "block") {
          const block = blockById.get(item.id);
          if (block) items.push({ type: "block", filePath: block.filePath });
        } else {
          // Use the explicit pick
          const pick = responseDocPicks[item.id];
          if (pick?.hotelId && pick?.docLang) {
            const doc = hotelDocsByHotelAndLang.get(`${pick.hotelId}_${pick.docLang}`);
            if (doc) {
              const text =
                localOfferTexts[item.id] ??
                responseById.get(item.id)?.offerText ??
                "";
              items.push({
                type: "hotel",
                filePath: doc.filePath,
                offerText: text || undefined,
              });
            }
          }
        }
      }

      if (items.length === 0) {
        setError("Sélectionnez au moins un document.");
        return;
      }

      const response = await fetch("/api/generate-offer-doc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(
          (data as { error?: string }).error ?? "Erreur lors de la génération."
        );
      }

      const blob = await response.blob();
      const offerName = offer.societeContact?.replace(/\s+/g, "_") ?? "offre";
      downloadBlob(blob, `Document_${offerName}.docx`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erreur lors de la génération."
      );
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
        Chargement…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <p>{error}</p>
        </div>
      )}

      {/* Filters */}
      <section className="rounded-xl border border-white/70 bg-white/90 p-4 shadow-sm ring-1 ring-white/60">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Filtres
          </span>

          <div className="flex items-center gap-1.5">
            <select
              value={filterDest}
              onChange={(e) => setFilterDest(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-700 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="">Toutes destinations</option>
              {destinations.map((d) => (
                <option key={d} value={d}>
                  {DEST_LABELS[d] ?? d}
                </option>
              ))}
            </select>
            {filterDest && (
              <button type="button" onClick={() => setFilterDest("")} className="text-xs text-slate-400 hover:text-slate-600">
                Tous
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <select
              value={filterSeason}
              onChange={(e) => setFilterSeason(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-700 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="">Toutes saisons</option>
              {seasons.map((s) => (
                <option key={s} value={s}>
                  {SEASON_LABELS[s] ?? s}
                </option>
              ))}
            </select>
            {filterSeason && (
              <button type="button" onClick={() => setFilterSeason("")} className="text-xs text-slate-400 hover:text-slate-600">
                Tous
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <select
              value={filterLang}
              onChange={(e) => setFilterLang(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-700 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="">Toutes langues</option>
              {langs.map((l) => (
                <option key={l} value={l}>
                  {LANG_LABELS[l] ?? l}
                </option>
              ))}
            </select>
            {filterLang && (
              <button type="button" onClick={() => setFilterLang("")} className="text-xs text-slate-400 hover:text-slate-600">
                Tous
              </button>
            )}
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* LEFT PANEL: blocks + hotel responses for selection */}
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

        {/* RIGHT PANEL: ordered selection + DnD */}
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
      </div>
    </div>
  );
}
