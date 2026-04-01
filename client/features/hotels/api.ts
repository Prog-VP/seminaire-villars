import { createClient } from "@/lib/supabase/client";
import { throwOnError } from "@/lib/supabase/helpers";
import type { Hotel } from "./types";

function supabase() {
  return createClient();
}

export async function fetchHotels(): Promise<Hotel[]> {
  const data = throwOnError(
    await supabase()
      .from("hotels")
      .select("id, nom, email, email_cc, destination, created_at")
      .order("nom", { ascending: true })
  );
  return data ?? [];
}

export async function createHotel(
  nom: string,
  email: string | null,
  destination: string | null = null,
  email_cc: string | null = null
): Promise<Hotel> {
  const data = throwOnError(
    await supabase()
      .from("hotels")
      .insert({ nom, email: email || null, email_cc: email_cc || null, destination: destination || null })
      .select("id, nom, email, email_cc, destination, created_at")
      .single()
  );
  if (!data) throw new Error("Création échouée.");
  return data;
}

export async function updateHotel(
  id: string,
  fields: { nom: string; email: string | null; email_cc: string | null; destination: string | null }
): Promise<Hotel> {
  const data = throwOnError(
    await supabase()
      .from("hotels")
      .update({ nom: fields.nom, email: fields.email || null, email_cc: fields.email_cc || null, destination: fields.destination || null })
      .eq("id", id)
      .select("id, nom, email, email_cc, destination, created_at")
      .single()
  );
  if (!data) throw new Error("Mise à jour échouée.");
  return data;
}

/** Count how many offer_hotel_sends reference this hotel. */
export async function countOffersUsingHotel(hotelId: string): Promise<number> {
  const { count, error } = await supabase()
    .from("offer_hotel_sends")
    .select("id", { count: "exact", head: true })
    .eq("hotel_id", hotelId);
  if (error) throw error;
  return count ?? 0;
}

/** Count offers per hotel (batch). Returns a map hotelId → count. */
export async function countOffersPerHotel(): Promise<Record<string, number>> {
  const { data, error } = await supabase()
    .from("offer_hotel_sends")
    .select("hotel_id");
  if (error) throw error;
  const counts: Record<string, number> = {};
  // Count unique offer_ids per hotel would be better, but offer_hotel_sends
  // already represents one send per hotel per offer, so counting rows is fine.
  for (const row of data ?? []) {
    counts[row.hotel_id] = (counts[row.hotel_id] ?? 0) + 1;
  }
  return counts;
}

export async function deleteHotel(id: string): Promise<void> {
  throwOnError(await supabase().from("hotels").delete().eq("id", id));
}
