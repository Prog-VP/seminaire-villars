import { createClient } from "@/lib/supabase/client";
import { throwOnError } from "@/lib/supabase/helpers";
import type { DocumentBlock, HotelDocument } from "./types";

function supabase() {
  return createClient();
}

function mapBlock(row: Record<string, unknown>): DocumentBlock {
  return {
    id: row.id as string,
    destination: row.destination as string,
    season: row.season as string,
    lang: row.lang as string,
    name: row.name as string,
    filePath: row.file_path as string,
    createdAt: row.created_at as string,
  };
}

function mapHotelDoc(row: Record<string, unknown>): HotelDocument {
  return {
    id: row.id as string,
    hotelId: row.hotel_id as string,
    lang: row.lang as string,
    filePath: row.file_path as string,
    createdAt: row.created_at as string,
  };
}

// ---------------------------------------------------------------------------
// Document blocks CRUD
// ---------------------------------------------------------------------------

export async function fetchDocumentBlocks(): Promise<DocumentBlock[]> {
  const data = throwOnError(
    await supabase()
      .from("document_blocks")
      .select("*")
      .order("destination")
      .order("season")
      .order("lang")
      .order("name")
  );
  return (data ?? []).map(mapBlock);
}

export async function createDocumentBlock(
  destination: string,
  season: string,
  lang: string,
  name: string,
  file: File
): Promise<DocumentBlock> {
  const ext = file.name.split(".").pop() ?? "docx";
  const safeName = name
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .replace(/_+/g, "_");
  const filePath = `${destination}/${season}/${lang}/${Date.now()}_${safeName}.${ext}`;

  // Upload to storage
  const { error: uploadError } = await supabase()
    .storage.from("document-blocks")
    .upload(filePath, file);
  if (uploadError) {
    if (uploadError.message.includes("Invalid key")) {
      throw new Error(`Nom de fichier invalide : évitez les accents (é, è, à, ü…) et caractères spéciaux dans le nom du bloc.`);
    }
    throw new Error(uploadError.message);
  }

  // Insert row
  const data = throwOnError(
    await supabase()
      .from("document_blocks")
      .insert({ destination, season, lang, name, file_path: filePath })
      .select("*")
      .single()
  );
  if (!data) throw new Error("Création échouée.");
  return mapBlock(data);
}

export async function updateDocumentBlock(
  id: string,
  fields: { name?: string; season?: string }
): Promise<DocumentBlock> {
  const update: Record<string, unknown> = {};
  if (fields.name !== undefined) update.name = fields.name;
  if (fields.season !== undefined) update.season = fields.season;
  const { error } = await supabase()
    .from("document_blocks")
    .update(update)
    .eq("id", id);
  if (error) throw new Error(error.message);
  const { data, error: fetchError } = await supabase()
    .from("document_blocks")
    .select("*")
    .eq("id", id)
    .single();
  if (fetchError) throw new Error(fetchError.message);
  if (!data) throw new Error("Mise à jour échouée.");
  return mapBlock(data);
}

export async function deleteDocumentBlock(id: string, filePath: string): Promise<void> {
  // Delete from storage
  await supabase().storage.from("document-blocks").remove([filePath]);
  // Delete row
  throwOnError(await supabase().from("document_blocks").delete().eq("id", id));
}

export async function downloadDocumentBlock(filePath: string): Promise<Blob> {
  const { data, error } = await supabase()
    .storage.from("document-blocks")
    .download(filePath);
  if (error || !data) throw new Error(error?.message ?? "Téléchargement échoué.");
  return data;
}

// ---------------------------------------------------------------------------
// Hotel documents CRUD
// ---------------------------------------------------------------------------

export async function fetchHotelDocuments(hotelId: string): Promise<HotelDocument[]> {
  const data = throwOnError(
    await supabase()
      .from("hotel_documents")
      .select("*")
      .eq("hotel_id", hotelId)
      .order("lang")
  );
  return (data ?? []).map(mapHotelDoc);
}

export async function fetchAllHotelDocuments(): Promise<HotelDocument[]> {
  const data = throwOnError(
    await supabase()
      .from("hotel_documents")
      .select("*")
      .order("hotel_id")
      .order("lang")
  );
  return (data ?? []).map(mapHotelDoc);
}

export async function uploadHotelDocument(
  hotelId: string,
  lang: string,
  file: File
): Promise<HotelDocument> {
  const ext = file.name.split(".").pop() ?? "docx";
  const filePath = `${hotelId}/${lang}/${Date.now()}.${ext}`;

  // Upload to storage
  const { error: uploadError } = await supabase()
    .storage.from("hotel-documents")
    .upload(filePath, file);
  if (uploadError) {
    if (uploadError.message.includes("Invalid key")) {
      throw new Error(`Nom de fichier invalide : évitez les accents (é, è, à, ü…) et caractères spéciaux dans le nom.`);
    }
    throw new Error(uploadError.message);
  }

  // Upsert row (unique on hotel_id + lang)
  const data = throwOnError(
    await supabase()
      .from("hotel_documents")
      .upsert(
        { hotel_id: hotelId, lang, file_path: filePath },
        { onConflict: "hotel_id,lang" }
      )
      .select("*")
      .single()
  );
  if (!data) throw new Error("Upload échoué.");
  return mapHotelDoc(data);
}

export async function deleteHotelDocument(id: string, filePath: string): Promise<void> {
  await supabase().storage.from("hotel-documents").remove([filePath]);
  throwOnError(await supabase().from("hotel_documents").delete().eq("id", id));
}

export async function downloadHotelDocument(filePath: string): Promise<Blob> {
  const { data, error } = await supabase()
    .storage.from("hotel-documents")
    .download(filePath);
  if (error || !data) throw new Error(error?.message ?? "Téléchargement échoué.");
  return data;
}

// ---------------------------------------------------------------------------
// Offer document selections (persisted block/response picks per offer)
// ---------------------------------------------------------------------------

export type SelectionRow = {
  type: "block" | "response";
  id: string;
  hotelDocumentId?: string;
};

export async function fetchOfferSelections(
  offerId: string
): Promise<{
  blockIds: string[];
  responseIds: string[];
  responseHotelDocMap: Record<string, string>;
  orderedItems: SelectionRow[];
}> {
  const data = throwOnError(
    await supabase()
      .from("offer_document_selections")
      .select("block_id, response_id, hotel_document_id, sort_order")
      .eq("offer_id", offerId)
      .order("sort_order")
  );

  const blockIds: string[] = [];
  const responseIds: string[] = [];
  const responseHotelDocMap: Record<string, string> = {};
  const orderedItems: SelectionRow[] = [];

  for (const row of data ?? []) {
    if (row.block_id) {
      const id = row.block_id as string;
      blockIds.push(id);
      orderedItems.push({ type: "block", id });
    }
    if (row.response_id) {
      const id = row.response_id as string;
      responseIds.push(id);
      orderedItems.push({
        type: "response",
        id,
        hotelDocumentId: (row.hotel_document_id as string) ?? undefined,
      });
      if (row.hotel_document_id) {
        responseHotelDocMap[id] = row.hotel_document_id as string;
      }
    }
  }
  return { blockIds, responseIds, responseHotelDocMap, orderedItems };
}

export async function addOfferSelection(
  offerId: string,
  selection: { blockId?: string; responseId?: string },
  sortOrder: number = 0,
  hotelDocumentId?: string | null
): Promise<void> {
  const { error } = await supabase()
    .from("offer_document_selections")
    .insert({
      offer_id: offerId,
      block_id: selection.blockId ?? null,
      response_id: selection.responseId ?? null,
      hotel_document_id: hotelDocumentId ?? null,
      sort_order: sortOrder,
    });
  // Ignore unique violation (row already exists), throw on other errors
  if (error && error.code !== "23505") throw new Error(error.message);
}

export async function updateResponseHotelDoc(
  offerId: string,
  responseId: string,
  hotelDocumentId: string | null
): Promise<void> {
  throwOnError(
    await supabase()
      .from("offer_document_selections")
      .update({ hotel_document_id: hotelDocumentId })
      .eq("offer_id", offerId)
      .eq("response_id", responseId)
  );
}

export async function updateSelectionOrder(
  offerId: string,
  items: { blockId?: string; responseId?: string; sortOrder: number }[]
): Promise<void> {
  // Update each selection's sort_order individually
  await Promise.all(
    items.map((item) => {
      let query = supabase()
        .from("offer_document_selections")
        .update({ sort_order: item.sortOrder })
        .eq("offer_id", offerId);
      if (item.blockId) {
        query = query.eq("block_id", item.blockId);
      } else if (item.responseId) {
        query = query.eq("response_id", item.responseId);
      }
      return query;
    })
  );
}

export async function fetchOfferTexts(
  offerId: string
): Promise<Record<string, string>> {
  const { data } = await supabase()
    .from("hotel_responses")
    .select("id, offerText")
    .eq("offer_id", offerId);
  const map: Record<string, string> = {};
  for (const row of (data ?? []) as { id: string; offerText: string | null }[]) {
    if (row.offerText) map[row.id] = row.offerText;
  }
  return map;
}

export async function saveOfferText(
  responseId: string,
  offerText: string
): Promise<void> {
  await supabase()
    .from("hotel_responses")
    .update({ offerText: offerText || null } as Record<string, unknown>)
    .eq("id", responseId);
}

export async function removeOfferSelection(
  offerId: string,
  selection: { blockId?: string; responseId?: string }
): Promise<void> {
  let query = supabase()
    .from("offer_document_selections")
    .delete()
    .eq("offer_id", offerId);

  if (selection.blockId) {
    query = query.eq("block_id", selection.blockId);
  } else if (selection.responseId) {
    query = query.eq("response_id", selection.responseId);
  }

  throwOnError(await query);
}
