import { createClient } from "@/lib/supabase/client";
import type { SettingType, SettingValue, SettingsMap } from "./types";

function supabase() {
  return createClient();
}

function throwOnError<T>(result: { data: T; error: { message: string } | null }): T {
  if (result.error) throw new Error(result.error.message);
  return result.data;
}

function normalizeSettingsMap(
  rows: { id: string; type: string; label: string }[]
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
  };

  for (const row of rows) {
    const type = row.type as SettingType;
    if (type in map) {
      map[type].push({ id: row.id, type, label: row.label });
    }
  }

  return map;
}

export async function fetchSettings(): Promise<SettingsMap> {
  const data = throwOnError(
    await supabase()
      .from("settings")
      .select("id, type, label")
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
      .select("id, type, label")
      .eq("type", type)
      .order("label", { ascending: true })
  );
  return (data ?? []).map((row) => ({
    id: row.id,
    type: row.type as SettingType,
    label: row.label,
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
      .select("id, type, label")
      .single()
  );
  if (!data) throw new Error("Création échouée.");
  return { id: data.id, type: data.type as SettingType, label: data.label };
}

export async function updateSettingValue(
  id: string,
  label: string
): Promise<SettingValue> {
  const data = throwOnError(
    await supabase()
      .from("settings")
      .update({ label })
      .eq("id", id)
      .select("id, type, label")
      .single()
  );
  if (!data) throw new Error("Mise à jour échouée.");
  return { id: data.id, type: data.type as SettingType, label: data.label };
}

export async function deleteSettingValue(id: string) {
  throwOnError(
    await supabase().from("settings").delete().eq("id", id)
  );
}
