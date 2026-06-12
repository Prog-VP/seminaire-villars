import { createClient } from "@/lib/supabase/client";
import { throwOnError } from "@/lib/supabase/helpers";
import type { DocumentBlock } from "./types";

function supabase() {
  return createClient();
}

export async function fetchMasterPowerPoint(): Promise<DocumentBlock | null> {
  const response = await fetch("/api/document-master-ppt");
  const payload = (await response.json().catch(() => ({}))) as {
    master?: DocumentBlock | null;
    error?: string;
  };
  if (!response.ok) throw new Error(payload.error ?? "Impossible de charger le document MASTER.");
  return payload.master ?? null;
}

export async function uploadMasterPowerPoint(file: File): Promise<DocumentBlock> {
  const formData = new FormData();
  formData.set("file", file);
  const response = await fetch("/api/document-master-ppt", {
    method: "POST",
    body: formData,
  });
  const payload = (await response.json().catch(() => ({}))) as {
    master?: DocumentBlock;
    error?: string;
  };
  if (!response.ok || !payload.master) {
    throw new Error(payload.error ?? "Impossible d'enregistrer le document MASTER.");
  }
  return payload.master;
}

export async function deleteMasterPowerPoint(): Promise<void> {
  const response = await fetch("/api/document-master-ppt", {
    method: "DELETE",
  });
  const payload = (await response.json().catch(() => ({}))) as { error?: string };
  if (!response.ok) throw new Error(payload.error ?? "Impossible de supprimer le document MASTER.");
}

export async function downloadMasterPowerPoint(): Promise<void> {
  window.location.assign("/api/document-master-ppt?download=1");
}

export async function saveOfferText(
  responseId: string,
  offerText: string
): Promise<void> {
  throwOnError(
    await supabase()
      .from("hotel_responses")
      .update({ offerText: offerText || null } as Record<string, unknown>)
      .eq("id", responseId)
  );
}

export async function saveResponseHotel(
  responseId: string,
  hotelId: string | null
): Promise<void> {
  throwOnError(
    await supabase()
      .from("hotel_responses")
      .update({ hotel_id: hotelId } as Record<string, unknown>)
      .eq("id", responseId)
  );
}
