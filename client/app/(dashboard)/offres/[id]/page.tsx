import { BackButton } from "@/components/navigation/BackButton";
import { OfferDetail } from "@/features/offres/components/OfferDetail";
import { createClient } from "@/lib/supabase/server";
import { mapRow } from "@/features/offres/api";
import type { Offer } from "@/features/offres/types";

type OfferDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function OfferDetailPage({
  params,
}: OfferDetailPageProps) {
  const { id } = await params;

  let offer: Offer | null = null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("offers")
    .select("*, hotel_responses(*), offer_comments(*)")
    .eq("id", id)
    .single();

  if (!error && data) {
    offer = mapRow(data);
  }

  return (
    <div className="space-y-6">
      <BackButton href="/offres" />
      <OfferDetail offer={offer ?? undefined} />
    </div>
  );
}
