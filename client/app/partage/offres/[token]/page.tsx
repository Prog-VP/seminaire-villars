import { ShareOfferView } from "@/features/offres/components/ShareOfferView";
import { createClient } from "@/lib/supabase/server";
import type { SharedOfferResponse } from "@/features/offres/api";
import type { HotelResponse } from "@/features/offres/types";

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
      offer = {
        id: row.id,
        societeContact: row.societeContact,
        sejourDu: row.sejourDu ?? null,
        sejourAu: row.sejourAu ?? null,
        nombrePax: row.nombrePax ?? null,
        nombreDeNuits: row.nombreDeNuits ?? null,
        hotelResponses: (row.hotelResponses ?? []).map(
          (r: Record<string, unknown>): HotelResponse => ({
            id: r.id as string,
            hotelName: r.hotelName as string,
            respondentName: r.respondentName as string | undefined,
            message: r.message as string,
            createdAt: r.createdAt as string | undefined,
          })
        ),
      };
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
