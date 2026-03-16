import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { mapRow } from "@/features/offres/api";
import type { Offer } from "@/features/offres/types";
import { StatsBoard } from "@/features/statistiques/components/StatsBoard";

export default async function StatistiquesPage() {
  let offers: Offer[] = [];
  let error: string | null = null;

  try {
    const supabase = await createClient();
    const { data, error: dbError } = await supabase
      .from("offers")
      .select("*, hotel_responses(*), offer_comments(*), offer_hotel_sends(id, hotels(nom))")
      .order("createdAt", { ascending: false });

    if (dbError) throw new Error(dbError.message);

    offers = (data ?? []).map(mapRow);
  } catch (err) {
    error =
      err instanceof Error
        ? err.message
        : "Impossible de charger les statistiques.";
  }

  return (
    <div className="space-y-6">
      <Suspense>
        <StatsBoard offers={offers} errorMessage={error} />
      </Suspense>
    </div>
  );
}
