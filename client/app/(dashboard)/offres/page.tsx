import { OfferTable } from "@/features/offres/components/OfferTable";
import { createClient } from "@/lib/supabase/server";
import { mapRow } from "@/features/offres/api";
import type { Offer } from "@/features/offres/types";

type OffresPageProps = {
  searchParams?: Promise<{ statsFilter?: string | string[] }>;
};

export default async function OffresPage({ searchParams }: OffresPageProps) {
  let offers: Offer[] = [];
  let error: string | null = null;
  const params = await searchParams;
  const statsFilterToken = Array.isArray(params?.statsFilter)
    ? params?.statsFilter[0]
    : params?.statsFilter;

  try {
    const supabase = await createClient();
    const { data, error: dbError } = await supabase
      .from("offers")
      .select("*, hotel_responses(*), offer_comments(*), offer_hotel_sends(id, hotels(nom))")
      .order("numeroOffre", { ascending: false });

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
      <OfferTable data={offers} errorMessage={error} statsFilterToken={statsFilterToken ?? null} />
    </div>
  );
}
