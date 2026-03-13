import { ShareOfferView } from "@/features/offres/components/ShareOfferView";
import { createClient } from "@/lib/supabase/server";
import { mapSharedOfferRow, type SharedOfferResponse } from "@/features/offres/api";

type ShareOfferPageProps = {
  params: Promise<{ token: string }>;
};

export default async function ShareOfferPage({ params }: ShareOfferPageProps) {
  const { token } = await params;

  let offer: SharedOfferResponse | null = null;
  let chfEurRate = 0.94;

  try {
    const supabase = await createClient();

    const [offerResult, rateResult] = await Promise.all([
      supabase.rpc("get_shared_offer", { p_token: token }),
      supabase.from("app_config").select("value").eq("key", "chf_eur_rate").single(),
    ]);

    if (offerResult.error) throw new Error(offerResult.error.message);

    const row = Array.isArray(offerResult.data) ? offerResult.data[0] : offerResult.data;
    if (row) {
      offer = mapSharedOfferRow(row);
    }

    if (rateResult.data?.value) {
      const parsed = parseFloat(rateResult.data.value);
      if (!isNaN(parsed) && parsed > 0) {
        chfEurRate = parsed;
      }
    }
  } catch {
    offer = null;
  }

  return (
    <div className="min-h-screen bg-slate-100 py-10">
      <div className="mx-auto w-full max-w-3xl px-4">
        <ShareOfferView token={token} initialData={offer} chfEurRate={chfEurRate} />
      </div>
    </div>
  );
}
