import { createClient } from "@/lib/supabase/client";

function supabase() {
  return createClient();
}

function throwOnError<T>(result: { data: T; error: { message: string } | null }): T {
  if (result.error) throw new Error(result.error.message);
  return result.data;
}

export async function fetchAppConfig(): Promise<Record<string, string>> {
  const { data, error } = await supabase().from("app_config").select("key, value");
  if (error) throw new Error(error.message);
  const map: Record<string, string> = {};
  for (const row of data ?? []) {
    map[row.key] = row.value;
  }
  return map;
}

export async function saveAppConfig(key: string, value: string): Promise<void> {
  throwOnError(
    await supabase()
      .from("app_config")
      .upsert({ key, value }, { onConflict: "key" })
  );
}
