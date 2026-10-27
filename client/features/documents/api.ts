import { createClient } from "@/lib/supabase/client";
import { downloadUrl } from "@/lib/download";
import { MASTER_POWERPOINT_LANGS } from "./types";
import type { DocumentBlock, MasterPowerPointLang, MasterPowerPointMap } from "./types";

function supabase() {
  return createClient();
}

function emptyMasterPowerPointMap(): MasterPowerPointMap {
  return {
    FR: null,
    EN: null,
    DE: null,
  };
}

function masterPowerPointUrl(lang?: MasterPowerPointLang) {
  const params = new URLSearchParams();
  if (lang) params.set("lang", lang);
  const query = params.toString();
  return `/api/document-master-ppt${query ? `?${query}` : ""}`;
}

export async function fetchMasterPowerPoints(): Promise<MasterPowerPointMap> {
  const response = await fetch("/api/document-master-ppt");
  const payload = (await response.json().catch(() => ({}))) as {
    masters?: Partial<Record<MasterPowerPointLang, DocumentBlock | null>>;
    error?: string;
  };
  if (!response.ok) throw new Error(payload.error ?? "Impossible de charger le document MASTER.");
  const masters = emptyMasterPowerPointMap();
  for (const lang of MASTER_POWERPOINT_LANGS) {
    masters[lang] = payload.masters?.[lang] ?? null;
  }
  return masters;
}

export async function uploadMasterPowerPoint(
  lang: MasterPowerPointLang,
  file: File
): Promise<DocumentBlock> {
  const prepareResponse = await fetch("/api/document-master-ppt", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "prepare-upload",
      lang,
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
      lang,
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

export async function deleteMasterPowerPoint(lang: MasterPowerPointLang): Promise<void> {
  const response = await fetch(masterPowerPointUrl(lang), {
    method: "DELETE",
  });
  const payload = (await response.json().catch(() => ({}))) as { error?: string };
  if (!response.ok) throw new Error(payload.error ?? "Impossible de supprimer le document MASTER.");
}

export async function downloadMasterPowerPoint(lang: MasterPowerPointLang): Promise<void> {
  const params = new URLSearchParams({ download: "1", lang });
  downloadUrl(`/api/document-master-ppt?${params.toString()}`);
}
