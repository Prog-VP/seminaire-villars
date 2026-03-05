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
      .select("id, nom, email, created_at")
      .order("nom", { ascending: true })
  );
  return data ?? [];
}

export async function createHotel(
  nom: string,
  email: string | null
): Promise<Hotel> {
  const data = throwOnError(
    await supabase()
      .from("hotels")
      .insert({ nom, email: email || null })
      .select("id, nom, email, created_at")
      .single()
  );
  if (!data) throw new Error("Création échouée.");
  return data;
}

export async function updateHotel(
  id: string,
  fields: { nom: string; email: string | null }
): Promise<Hotel> {
  const data = throwOnError(
    await supabase()
      .from("hotels")
      .update({ nom: fields.nom, email: fields.email || null })
      .eq("id", id)
      .select("id, nom, email, created_at")
      .single()
  );
  if (!data) throw new Error("Mise à jour échouée.");
  return data;
}

export async function deleteHotel(id: string): Promise<void> {
  throwOnError(await supabase().from("hotels").delete().eq("id", id));
}
