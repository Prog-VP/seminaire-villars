import { createClient } from "@/lib/supabase/client";

export function supabase() {
  return createClient();
}
