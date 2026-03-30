import { throwOnError } from "@/lib/supabase/helpers";
import type { Offer } from "../types";
import { supabase } from "./client";
import { mapRow } from "./mappers";
import { listOfferAttachments } from "./attachments";
import { fetchOfferHotelSends } from "./hotel-sends";

export async function fetchOffers(): Promise<Offer[]> {
  const data = throwOnError(
    await supabase()
      .from("offers")
      .select("*, hotel_responses(*), offer_comments(*), offer_hotel_sends(id, hotels(nom))")
      .order("numeroOffre", { ascending: false })
  );
  return (data ?? []).map(mapRow);
}

export async function fetchOfferById(id: string): Promise<Offer | null> {
  if (!id) return null;
  const { data, error } = await supabase()
    .from("offers")
    .select("*, hotel_responses(*), offer_comments(*)")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Erreur fetchOfferById:", error.message);
    return null;
  }
  return mapRow(data);
}

export async function createOffer(payload: Partial<Offer>) {
  const { id: _id, numeroOffre: _no, hotelResponses: _hr, comments: _c, attachmentsCount: _ac, hotelSendsCount: _hsc, hotelSendsNames: _hsn, ...rest } = payload;
  const data = throwOnError(
    await supabase().from("offers").insert(rest).select().single()
  );
  return mapRow(data);
}

export async function updateOffer(id: string, payload: Partial<Offer>) {
  const { id: _id, numeroOffre: _no, hotelResponses: _hr, comments: _c, attachmentsCount: _ac, hotelSendsCount: _hsc, hotelSendsNames: _hsn, ...rest } = payload;
  const data = throwOnError(
    await supabase().from("offers").update(rest).eq("id", id).select().single()
  );
  return mapRow(data);
}

export async function updateOfferStatut(id: string, statut: string) {
  throwOnError(
    await supabase()
      .from("offers")
      .update({ statut } as Record<string, unknown>)
      .eq("id", id)
  );
}

export async function deleteOffer(id: string) {
  const { data: files } = await supabase()
    .storage
    .from("offer-annexes")
    .list(id);

  if (files && files.length > 0) {
    const paths = files.map((f) => `${id}/${f.name}`);
    await supabase().storage.from("offer-annexes").remove(paths);
  }

  throwOnError(await supabase().from("offers").delete().eq("id", id));
}

export async function duplicateOffer(
  id: string,
  options: { includeAttachments: boolean; includeHotelData: boolean }
): Promise<Offer> {
  const source = await fetchOfferById(id);
  if (!source) throw new Error("Offre introuvable.");

  const {
    id: _id,
    numeroOffre: _no,
    hotelResponses: _hr,
    comments: _c,
    attachmentsCount: _ac,
    hotelSendsCount: _hsc,
    hotelSendsNames: _hsn,
    createdAt: _ca,
    updatedAt: _ua,
    shareToken: _st,
    ...offerData
  } = source;
  const newOffer = await createOffer(offerData);

  if (options.includeHotelData) {
    for (const hr of source.hotelResponses ?? []) {
      await supabase()
        .from("hotel_responses")
        .insert({
          offer_id: newOffer.id,
          hotelName: hr.hotelName,
          respondentName: hr.respondentName ?? null,
          message: hr.message,
          offerText: hr.offerText ?? null,
        });
    }
    const sends = await fetchOfferHotelSends(id);
    for (const send of sends) {
      await supabase()
        .from("offer_hotel_sends")
        .insert({
          offer_id: newOffer.id,
          hotel_id: send.hotelId,
          sent_at: send.sentAt,
        });
    }
  }

  if (options.includeAttachments) {
    const attachments = await listOfferAttachments(id);
    for (const att of attachments) {
      const { data: blob } = await supabase()
        .storage
        .from("offer-annexes")
        .download(`${id}/${att.id}`);
      if (blob) {
        await supabase()
          .storage
          .from("offer-annexes")
          .upload(`${newOffer.id}/${att.id}`, blob, { upsert: false });
      }
    }
  }

  return newOffer;
}

export async function fetchCategorieHotelAutreSuggestions(): Promise<string[]> {
  const { data } = await supabase()
    .from("offers")
    .select("categorieHotelAutre")
    .not("categorieHotelAutre", "is", null)
    .not("categorieHotelAutre", "eq", "");

  if (!data) return [];
  const unique = new Set(
    data.map((r) => (r.categorieHotelAutre as string).trim()).filter(Boolean)
  );
  return [...unique].sort();
}
