import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AccessGate } from "@/features/auth/components/AccessGate";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    redirect("/offres");
  }

  return <AccessGate />;
}
