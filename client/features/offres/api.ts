import { createClient } from "@/lib/supabase/client";
import type {
  Offer,
  HotelResponse,
  HotelResponseConfirmation,
  OfferAttachment,
  OfferComment,
} from "./types";

export type SharedOfferResponse = {
  id: string;
  societeContact: string;
  sejourDu?: string | null;
  sejourAu?: string | null;
  nombrePax?: number | null;
  nombreDeNuits?: string | null;
  hotelResponses: HotelResponse[];
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function supabase() {
  return createClient();
}

function throwOnError<T>(result: { data: T; error: { message: string } | null }): T {
  if (result.error) throw new Error(result.error.message);
  return result.data;
}

function mapRow(row: Record<string, unknown>): Offer {
  const hotelResponses = Array.isArray(row.hotel_responses)
    ? (row.hotel_responses as Record<string, unknown>[]).map(mapHotelResponse)
    : [];

  let commentsCount: number | undefined;
  let comments: OfferComment[] | undefined;

  if (Array.isArray(row.offer_comments)) {
    // Full comments were fetched
    comments = (row.offer_comments as Record<string, unknown>[]).map(mapComment);
  } else if (
    Array.isArray(row.offer_comments) === false &&
    row.offer_comments &&
    typeof row.offer_comments === "object" &&
    "count" in (row.offer_comments as Record<string, unknown>)
  ) {
    commentsCount = (row.offer_comments as { count: number }).count;
  }

  return {
    id: row.id as string,
    societeContact: row.societeContact as string,
    dateEnvoiOffre: (row.dateEnvoiOffre as string) ?? null,
    typeSociete: (row.typeSociete as string) ?? "",
    pays: (row.pays as string) ?? "",
    emailContact: row.emailContact as string | undefined,
    langue: row.langue as string | undefined,
    titreContact: row.titreContact as string | undefined,
    nomContact: row.nomContact as string | undefined,
    prenomContact: row.prenomContact as string | undefined,
    sejourDu: (row.sejourDu as string) ?? null,
    sejourAu: (row.sejourAu as string) ?? null,
    activitesVillarsDiablerets: row.activitesVillarsDiablerets as boolean | undefined,
    nombreDeNuits: row.nombreDeNuits as string | undefined,
    nombrePax: row.nombrePax as number | undefined,
    transmisPar: row.transmisPar as string | undefined,
    typeSejour: row.typeSejour as string | undefined,
    categorieHotel: row.categorieHotel as string | undefined,
    stationDemandee: row.stationDemandee as string | undefined,
    relanceEffectueeLe: (row.relanceEffectueeLe as string) ?? null,
    reservationEffectuee: row.reservationEffectuee as boolean | undefined,
    contactEntreDansBrevo: row.contactEntreDansBrevo as boolean | undefined,
    autres: row.autres as string | undefined,
    traitePar: row.traitePar as string | undefined,
    createdAt: row.createdAt as string | undefined,
    updatedAt: row.updatedAt as string | undefined,
    shareToken: (row.shareToken as string) ?? null,
    hotelResponses,
    comments,
    attachmentsCount: commentsCount,
  };
}

function mapHotelResponse(row: Record<string, unknown>): HotelResponse {
  return {
    id: row.id as string,
    hotelName: row.hotelName as string,
    respondentName: row.respondentName as string | undefined,
    message: row.message as string,
    createdAt: row.createdAt as string | undefined,
  };
}

function mapComment(row: Record<string, unknown>): OfferComment {
  return {
    id: row.id as string,
    author: row.author as string,
    content: row.content as string,
    date: row.date as string | undefined,
    createdAt: row.createdAt as string | undefined,
  };
}

// ---------------------------------------------------------------------------
// Offers CRUD
// ---------------------------------------------------------------------------

export async function fetchOffers(): Promise<Offer[]> {
  const data = throwOnError(
    await supabase()
      .from("offers")
      .select("*, hotel_responses(*), offer_comments(count)")
      .order("createdAt", { ascending: false })
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
  const { id: _id, hotelResponses: _hr, comments: _c, attachmentsCount: _ac, ...rest } = payload;
  const data = throwOnError(
    await supabase().from("offers").insert(rest).select().single()
  );
  return mapRow(data);
}

export async function updateOffer(id: string, payload: Partial<Offer>) {
  const { id: _id, hotelResponses: _hr, comments: _c, attachmentsCount: _ac, ...rest } = payload;
  const data = throwOnError(
    await supabase().from("offers").update(rest).eq("id", id).select().single()
  );
  return mapRow(data);
}

export async function deleteOffer(id: string) {
  // Delete storage files first
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

// ---------------------------------------------------------------------------
// Sharing
// ---------------------------------------------------------------------------

export async function createShareLink(id: string) {
  const token = crypto.randomUUID();
  throwOnError(
    await supabase()
      .from("offers")
      .update({ shareToken: token } as Record<string, unknown>)
      .eq("id", id)
  );

  const shareUrl = `${window.location.origin}/partage/offres/${token}`;
  return { token, shareUrl };
}

export async function fetchSharedOffer(token: string): Promise<SharedOfferResponse> {
  const data = throwOnError(
    await supabase().rpc("get_shared_offer", { p_token: token })
  );

  if (!data || (Array.isArray(data) && data.length === 0)) {
    throw new Error("Offre introuvable.");
  }

  const row = Array.isArray(data) ? data[0] : data;
  return {
    id: row.id,
    societeContact: row.societeContact,
    sejourDu: row.sejourDu ?? null,
    sejourAu: row.sejourAu ?? null,
    nombrePax: row.nombrePax ?? null,
    nombreDeNuits: row.nombreDeNuits ?? null,
    hotelResponses: (row.hotelResponses ?? []).map((r: Record<string, unknown>) => ({
      id: r.id as string,
      hotelName: r.hotelName as string,
      respondentName: r.respondentName as string | undefined,
      message: r.message as string,
      createdAt: r.createdAt as string | undefined,
    })),
  };
}

export async function submitHotelResponse(
  token: string,
  payload: {
    hotelName: string;
    respondentName?: string;
    message: string;
    wantsConfirmation?: boolean;
  }
): Promise<{
  hotelResponses: HotelResponse[];
  confirmation: HotelResponseConfirmation | null;
}> {
  const data = throwOnError(
    await supabase().rpc("submit_hotel_response", {
      p_token: token,
      p_hotel_name: payload.hotelName,
      p_respondent_name: payload.respondentName ?? null,
      p_message: payload.message,
      p_wants_confirmation: payload.wantsConfirmation ?? false,
    })
  );

  const result = Array.isArray(data) ? data[0] : data;
  return {
    hotelResponses: (result.hotelResponses ?? []).map(
      (r: Record<string, unknown>) => ({
        id: r.id as string,
        hotelName: r.hotelName as string,
        respondentName: r.respondentName as string | undefined,
        message: r.message as string,
        createdAt: r.createdAt as string | undefined,
      })
    ),
    confirmation: result.confirmation ?? null,
  };
}

// ---------------------------------------------------------------------------
// Hotel Responses (dashboard)
// ---------------------------------------------------------------------------

export async function updateHotelResponse(
  offerId: string,
  responseId: string,
  payload: { hotelName: string; respondentName?: string; message: string }
) {
  throwOnError(
    await supabase()
      .from("hotel_responses")
      .update({
        hotelName: payload.hotelName,
        respondentName: payload.respondentName ?? null,
        message: payload.message,
      } as Record<string, unknown>)
      .eq("id", responseId)
      .eq("offer_id", offerId)
  );

  // Return all responses for this offer
  const responses = throwOnError(
    await supabase()
      .from("hotel_responses")
      .select("*")
      .eq("offer_id", offerId)
      .order("createdAt", { ascending: true })
  );

  return { hotelResponses: (responses ?? []).map(mapHotelResponse) };
}

export async function deleteHotelResponse(offerId: string, responseId: string) {
  throwOnError(
    await supabase()
      .from("hotel_responses")
      .delete()
      .eq("id", responseId)
      .eq("offer_id", offerId)
  );

  const responses = throwOnError(
    await supabase()
      .from("hotel_responses")
      .select("*")
      .eq("offer_id", offerId)
      .order("createdAt", { ascending: true })
  );

  return { hotelResponses: (responses ?? []).map(mapHotelResponse) };
}

// ---------------------------------------------------------------------------
// Attachments (Supabase Storage)
// ---------------------------------------------------------------------------

export async function listOfferAttachments(
  offerId: string
): Promise<OfferAttachment[]> {
  const { data, error } = await supabase()
    .storage
    .from("offer-annexes")
    .list(offerId, { sortBy: { column: "created_at", order: "desc" } });

  if (error) throw new Error(error.message);

  return (data ?? []).map((file) => ({
    id: file.name,
    filename: file.name.replace(/^\d+-/, ""),
    length: file.metadata?.size ?? 0,
    contentType: file.metadata?.mimetype ?? null,
    uploadedAt: file.created_at ?? "",
  }));
}

export async function uploadOfferAttachment(
  offerId: string,
  file: File
): Promise<OfferAttachment[]> {
  const path = `${offerId}/${Date.now()}-${file.name}`;

  const { error } = await supabase()
    .storage
    .from("offer-annexes")
    .upload(path, file, { upsert: false });

  if (error) throw new Error(error.message);

  return listOfferAttachments(offerId);
}

export async function deleteOfferAttachment(
  offerId: string,
  attachmentId: string
): Promise<OfferAttachment[]> {
  const { error } = await supabase()
    .storage
    .from("offer-annexes")
    .remove([`${offerId}/${attachmentId}`]);

  if (error) throw new Error(error.message);

  return listOfferAttachments(offerId);
}

export async function downloadOfferAttachment(
  offerId: string,
  attachmentId: string
) {
  const { data, error } = await supabase()
    .storage
    .from("offer-annexes")
    .download(`${offerId}/${attachmentId}`);

  if (error) throw new Error(error.message);

  const filename = attachmentId.replace(/^\d+-/, "");
  return { blob: data, filename };
}

// ---------------------------------------------------------------------------
// Comments
// ---------------------------------------------------------------------------

export async function listOfferComments(
  offerId: string
): Promise<OfferComment[]> {
  const data = throwOnError(
    await supabase()
      .from("offer_comments")
      .select("*")
      .eq("offer_id", offerId)
      .order("createdAt", { ascending: true })
  );
  return (data ?? []).map(mapComment);
}

export async function addOfferComment(
  offerId: string,
  payload: { author: string; content: string; date?: string }
): Promise<OfferComment[]> {
  throwOnError(
    await supabase()
      .from("offer_comments")
      .insert({
        offer_id: offerId,
        author: payload.author,
        content: payload.content,
        date: payload.date ?? null,
      })
  );

  return listOfferComments(offerId);
}

export async function updateOfferComment(
  offerId: string,
  commentId: string,
  payload: { author: string; content: string; date?: string }
): Promise<OfferComment[]> {
  throwOnError(
    await supabase()
      .from("offer_comments")
      .update({
        author: payload.author,
        content: payload.content,
        date: payload.date ?? null,
      })
      .eq("id", commentId)
      .eq("offer_id", offerId)
  );

  return listOfferComments(offerId);
}

export async function deleteOfferComment(
  offerId: string,
  commentId: string
): Promise<OfferComment[]> {
  throwOnError(
    await supabase()
      .from("offer_comments")
      .delete()
      .eq("id", commentId)
      .eq("offer_id", offerId)
  );

  return listOfferComments(offerId);
}
