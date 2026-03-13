import type { OfferAttachment } from "../types";
import { supabase } from "./client";

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
  const safeName = file.name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${offerId}/${Date.now()}-${safeName}`;

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
