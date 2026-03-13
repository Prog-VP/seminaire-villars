import { createClient } from "@/lib/supabase/client";
import { throwOnError } from "@/lib/supabase/helpers";
import type { SettingType, SettingValue, SettingsMap } from "./types";

function supabase() {
  return createClient();
}

function normalizeSettingsMap(
  rows: { id: string; type: string; label: string; color?: string | null }[]
): SettingsMap {
  const map: SettingsMap = {
    transmisPar: [],
    traitePar: [],
    pays: [],
    langue: [],
    typeSociete: [],
    typeSejour: [],
    categorieHotel: [],
    stationDemandee: [],
    titreContact: [],
    statut: [],
    emailNotification: [],
  };

  for (const row of rows) {
    const type = row.type as SettingType;
    if (type in map) {
      map[type].push({ id: row.id, type, label: row.label, color: row.color });
    }
  }

  return map;
}

export async function fetchSettings(): Promise<SettingsMap> {
  const data = throwOnError(
    await supabase()
      .from("settings")
      .select("id, type, label, color")
      .order("label", { ascending: true })
  );
  return normalizeSettingsMap(data ?? []);
}

export async function fetchSettingsByType(
  type: SettingType
): Promise<SettingValue[]> {
  const data = throwOnError(
    await supabase()
      .from("settings")
      .select("id, type, label, color")
      .eq("type", type)
      .order("label", { ascending: true })
  );
  return (data ?? []).map((row) => ({
    id: row.id,
    type: row.type as SettingType,
    label: row.label,
    color: row.color,
  }));
}

export async function createSettingValue(
  type: SettingType,
  label: string
): Promise<SettingValue> {
  const data = throwOnError(
    await supabase()
      .from("settings")
      .insert({ type, label })
      .select("id, type, label, color")
      .single()
  );
  if (!data) throw new Error("Création échouée.");
  return { id: data.id, type: data.type as SettingType, label: data.label, color: data.color };
}

export async function updateSettingValue(
  id: string,
  label: string,
  color?: string | null
): Promise<SettingValue> {
  const patch: Record<string, unknown> = { label };
  if (color !== undefined) patch.color = color;
  const data = throwOnError(
    await supabase()
      .from("settings")
      .update(patch)
      .eq("id", id)
      .select("id, type, label, color")
      .single()
  );
  if (!data) throw new Error("Mise à jour échouée.");
  return { id: data.id, type: data.type as SettingType, label: data.label, color: data.color };
}

export async function deleteSettingValue(id: string) {
  throwOnError(
    await supabase().from("settings").delete().eq("id", id)
  );
}
