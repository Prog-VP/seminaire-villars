import { throwOnError } from "@/lib/supabase/helpers";
import type { OfferComment } from "../types";
import { supabase } from "./client";
import { mapComment } from "./mappers";

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
