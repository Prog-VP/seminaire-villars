"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  sortableKeyboardCoordinates,
  arrayMove,
} from "@dnd-kit/sortable";
import type { Offer, HotelResponse, OfferHotelSend } from "@/features/offres/types";
import { getEffectiveDates } from "@/features/offres/utils";
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
import {
  normalizeLang,
  selKey,
  type SelectionItem,
  type DocPick,
} from "./generate-doc-constants";

export type UseDocumentGenerationArgs = {
  offer: Offer;
  hotelResponses: HotelResponse[];
  sends: OfferHotelSend[];
};

export function useDocumentGeneration({
  offer,
  hotelResponses,
  sends,
}: UseDocumentGenerationArgs) {
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
  const seasons = useMemo(() => {
    const set = new Set<string>();
    for (const b of blocks) {
      for (const s of b.season.split(",")) {
        const trimmed = s.trim();
        if (trimmed) set.add(trimmed);
      }
    }
    return [...set];
  }, [blocks]);
  const langs = useMemo(() => [...new Set(blocks.map((b) => b.lang))], [blocks]);

  // Filtered blocks
  const filteredBlocks = useMemo(() => {
    return blocks.filter((b) => {
      if (filterDest && b.destination !== filterDest) return false;
      if (filterSeason && !b.season.split(",").map((s) => s.trim()).includes(filterSeason)) return false;
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

  const toggleBlock = useCallback((id: string) => {
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
  }, [selectedBlockSet, persistOrder, offer.id]);

  const toggleResponse = useCallback((id: string) => {
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
  }, [selectedResponseSet, persistOrder, offer.id, autoPickForResponse, resolveDocId]);

  const handleDocPickChange = useCallback((responseId: string, field: "hotelId" | "docLang", value: string) => {
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
  }, [lang, langsForHotel, resolveDocId, offer.id]);

  const removeItem = useCallback((item: SelectionItem) => {
    if (item.type === "block") toggleBlock(item.id);
    else toggleResponse(item.id);
  }, [toggleBlock, toggleResponse]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
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
  }, [persistOrder]);

  const handleOfferTextChange = useCallback((responseId: string, text: string) => {
    setLocalOfferTexts((prev) => ({ ...prev, [responseId]: text }));
    scheduleTextSave(responseId, text);
  }, [scheduleTextSave]);

  const handleGenerate = useCallback(async () => {
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

      // Build cover page placeholders from offer data
      const effectiveDates = getEffectiveDates(offer);
      const stayDate = effectiveDates.du ? new Date(effectiveDates.du) : null;
      const moisAnnee = stayDate
        ? stayDate.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })
        : "";

      const placeholders: Record<string, string> = {
        SOCIETE: offer.societeContact ?? "",
        MOIS_ANNEE: moisAnnee,
        NOMBRE_PAX: offer.nombrePax != null ? String(offer.nombrePax) : "",
        NOM_CONTACT: offer.nomContact ?? "",
        PRENOM_CONTACT: offer.prenomContact ?? "",
        EMAIL_CONTACT: offer.emailContact ?? "",
      };

      const response = await fetch("/api/generate-offer-doc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, placeholders }),
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
  }, [orderedItems, blockById, responseDocPicks, hotelDocsByHotelAndLang, localOfferTexts, responseById, offer]);

  return {
    // Data
    blocks,
    hotelDocs,
    hotels,
    isLoading,
    error,
    lang,

    // Selections
    selectedBlockIds,
    selectedResponseIds,
    orderedItems,
    responseDocPicks,
    selectedBlockSet,
    selectedResponseSet,

    // Filters
    filterDest,
    setFilterDest,
    filterSeason,
    setFilterSeason,
    filterLang,
    setFilterLang,

    // Local offer texts
    localOfferTexts,

    // Computed
    filteredBlocks,
    grouped,
    destinations,
    seasons,
    langs,
    responsesWithHotelId,
    blockById,
    responseById,
    hotelsWithDocs,
    hotelDocsByHotelAndLang,
    langsForHotel,

    // DnD
    sensors,
    handleDragEnd,

    // Actions
    toggleBlock,
    toggleResponse,
    handleDocPickChange,
    removeItem,
    handleOfferTextChange,
    handleGenerate,
    isGenerating,
  };
}
