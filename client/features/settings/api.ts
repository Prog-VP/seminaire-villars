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
  color?: string | null,
  oldLabel?: string
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

  const type = data.type as SettingType;

  // Cascade rename to offers if label changed
  if (oldLabel && oldLabel !== label && type !== "emailNotification") {
    const column = type as string;
    const multiFields: SettingType[] = ["categorieHotel", "stationDemandee"];

    if (multiFields.includes(type)) {
      // For comma-separated fields, fetch matching offers and update each
      const { data: rows } = await supabase()
        .from("offers")
        .select("id, " + column)
        .like(column, `%${oldLabel}%`);

      if (rows) {
        for (const row of rows) {
          const current = (row as unknown as Record<string, string>)[column] ?? "";
          const parts = current.split(",").map((p: string) => p.trim());
          const updated = parts
            .map((p: string) => (p === oldLabel ? label : p))
            .join(", ");
          await supabase()
            .from("offers")
            .update({ [column]: updated })
            .eq("id", row.id);
        }
      }
    } else {
      await supabase()
        .from("offers")
        .update({ [column]: label })
        .eq(column, oldLabel);
    }
  }

  return { id: data.id, type, label: data.label, color: data.color };
}

/** Count how many offers reference a given setting value. */
export async function countOffersUsingSetting(
  type: SettingType,
  label: string
): Promise<number> {
  // These types are not stored in offers
  if (type === "emailNotification") return 0;

  // For comma-separated fields, use ilike
  const multiFields: SettingType[] = ["categorieHotel", "stationDemandee"];
  const column = type as string;

  let query = supabase()
    .from("offers")
    .select("id", { count: "exact", head: true });

  if (multiFields.includes(type)) {
    query = query.like(column, `%${label}%`);
  } else {
    query = query.eq(column, label);
  }

  const { count, error } = await query;
  if (error) throw error;
  return count ?? 0;
}

export async function deleteSettingValue(id: string) {
  throwOnError(
    await supabase().from("settings").delete().eq("id", id)
  );
}
