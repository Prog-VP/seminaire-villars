import { throwOnError } from "@/lib/supabase/helpers";
import type { OfferHotelSend } from "../types";
import { supabase } from "./client";

export async function fetchOfferHotelSends(
  offerId: string
): Promise<OfferHotelSend[]> {
  const data = throwOnError(
    await supabase()
      .from("offer_hotel_sends")
      .select("id, offer_id, hotel_id, sent_at, hotels(nom, email)")
      .eq("offer_id", offerId)
      .order("sent_at", { ascending: false })
  );

  return (data ?? []).map((row: Record<string, unknown>) => {
    const hotel = row.hotels as Record<string, unknown> | null;
    return {
      id: row.id as string,
      hotelId: row.hotel_id as string,
      hotelName: (hotel?.nom as string) ?? "",
      hotelEmail: (hotel?.email as string) ?? null,
      sentAt: row.sent_at as string,
    };
  });
}

export async function recordHotelSend(
  offerId: string,
  hotelId: string
): Promise<void> {
  throwOnError(
    await supabase()
      .from("offer_hotel_sends")
      .upsert(
        { offer_id: offerId, hotel_id: hotelId, sent_at: new Date().toISOString() },
        { onConflict: "offer_id,hotel_id" }
      )
  );
}
