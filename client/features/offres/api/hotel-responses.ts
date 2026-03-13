import { throwOnError } from "@/lib/supabase/helpers";
import { supabase } from "./client";
import { mapHotelResponse } from "./mappers";

export async function updateHotelResponse(
  offerId: string,
  responseId: string,
  payload: {
    hotelName: string;
    respondentName?: string;
    message: string;
    offerText?: string | null;
  }
) {
  throwOnError(
    await supabase()
      .from("hotel_responses")
      .update({
        hotelName: payload.hotelName,
        respondentName: payload.respondentName ?? null,
        message: payload.message,
        offerText: payload.offerText ?? null,
      } as Record<string, unknown>)
      .eq("id", responseId)
      .eq("offer_id", offerId)
  );

  const responses = throwOnError(
    await supabase()
      .from("hotel_responses")
      .select("*")
      .eq("offer_id", offerId)
      .order("createdAt", { ascending: true })
  );

  return { hotelResponses: (responses ?? []).map(mapHotelResponse) };
}

export async function deleteHotelResponse(offerId: string, responseId: string) {
  throwOnError(
    await supabase()
      .from("hotel_responses")
      .delete()
      .eq("id", responseId)
      .eq("offer_id", offerId)
  );

  const responses = throwOnError(
    await supabase()
      .from("hotel_responses")
      .select("*")
      .eq("offer_id", offerId)
      .order("createdAt", { ascending: true })
  );

  return { hotelResponses: (responses ?? []).map(mapHotelResponse) };
}
