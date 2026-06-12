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
  const prepareResponse = await fetch("/api/document-master-ppt", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "prepare-upload",
      name: file.name,
    }),
  });

  const preparePayload = (await prepareResponse.json().catch(() => ({}))) as {
    filePath?: string;
    token?: string;
    error?: string;
  };

  if (!prepareResponse.ok || !preparePayload.filePath || !preparePayload.token) {
    throw new Error(preparePayload.error ?? "Impossible de préparer l'enregistrement du document MASTER.");
  }

  const ext = file.name.split(".").pop()?.toLowerCase();
  const contentType =
    file.type ||
    (ext === "pptx"
      ? "application/vnd.openxmlformats-officedocument.presentationml.presentation"
      : "application/vnd.ms-powerpoint");
  const { error: uploadError } = await supabase()
    .storage
    .from("document-blocks")
    .uploadToSignedUrl(preparePayload.filePath, preparePayload.token, file, { contentType });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const completeResponse = await fetch("/api/document-master-ppt", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "complete-upload",
      name: file.name,
      filePath: preparePayload.filePath,
    }),
  });

  const completePayload = (await completeResponse.json().catch(() => ({}))) as {
    master?: DocumentBlock;
    error?: string;
  };

  if (!completeResponse.ok || !completePayload.master) {
    throw new Error(completePayload.error ?? "Impossible d'enregistrer le document MASTER.");
  }

  return completePayload.master;
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
