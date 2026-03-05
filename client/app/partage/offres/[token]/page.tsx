import { ShareOfferView } from "@/features/offres/components/ShareOfferView";
import { createClient } from "@/lib/supabase/server";
import { mapSharedOfferRow, type SharedOfferResponse } from "@/features/offres/api";

type ShareOfferPageProps = {
  params: Promise<{ token: string }>;
};

export default async function ShareOfferPage({ params }: ShareOfferPageProps) {
  const { token } = await params;

  let offer: SharedOfferResponse | null = null;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("get_shared_offer", {
      p_token: token,
    });

    if (error) throw new Error(error.message);

    const row = Array.isArray(data) ? data[0] : data;
    if (row) {
      offer = mapSharedOfferRow(row);
    }
  } catch {
    offer = null;
  }

  return (
    <div className="min-h-screen bg-slate-100 py-10">
      <div className="mx-auto w-full max-w-3xl px-4">
        <ShareOfferView token={token} initialData={offer} />
      </div>
    </div>
  );
}
