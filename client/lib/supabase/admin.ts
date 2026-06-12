import { createClient } from "@supabase/supabase-js";
import { nodeRealtimeTransport } from "./realtime-transport";

export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { autoRefreshToken: false, persistSession: false },
      realtime: { transport: nodeRealtimeTransport },
    }
  );
}
