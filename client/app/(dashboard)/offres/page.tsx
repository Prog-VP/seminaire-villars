import { OfferTable } from "@/features/offres/components/OfferTable";
import { createClient } from "@/lib/supabase/server";
import { mapRow } from "@/features/offres/api";
import type { Offer } from "@/features/offres/types";

export default async function OffresPage() {
  let offers: Offer[] = [];
  let error: string | null = null;

  try {
    const supabase = await createClient();
    const { data, error: dbError } = await supabase
      .from("offers")
      .select("*, hotel_responses(*), offer_comments(count), offer_hotel_sends(id, hotels(nom))")
      .order("createdAt", { ascending: false });

    if (dbError) throw new Error(dbError.message);

    offers = (data ?? []).map(mapRow);
  } catch (err) {
    error =
      err instanceof Error
        ? err.message
        : "Impossible de charger les offres.";
  }

  return (
    <div className="space-y-6">
      <OfferTable data={offers} errorMessage={error} />
    </div>
  );
}
