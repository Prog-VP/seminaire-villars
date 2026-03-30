import { throwOnError } from "@/lib/supabase/helpers";
import type { HotelResponse, HotelResponseConfirmation } from "../types";
import { supabase } from "./client";
import type { SharedOfferResponse } from "./mappers";

export async function createShareLink(id: string) {
  const token = crypto.randomUUID();
  throwOnError(
    await supabase()
      .from("offers")
      .update({ shareToken: token } as Record<string, unknown>)
      .eq("id", id)
  );

  const shareUrl = `${window.location.origin}/partage/offres/${token}`;
  return { token, shareUrl };
}

export async function fetchSharedOffer(token: string): Promise<SharedOfferResponse> {
  const data = throwOnError(
    await supabase().rpc("get_shared_offer", { p_token: token })
  );

  if (!data || (Array.isArray(data) && data.length === 0)) {
    throw new Error("Offre introuvable.");
  }

  const row = Array.isArray(data) ? data[0] : data;
  return {
    id: row.id,
    societeContact: row.societeContact,
    dateOptions: row.dateOptions ?? [],
    dateConfirmeeDu: row.dateConfirmeeDu ?? null,
    dateConfirmeeAu: row.dateConfirmeeAu ?? null,
    nombrePax: row.nombrePax ?? null,
    nombreDeNuits: row.nombreDeNuits ?? null,
    chambresSimple: row.chambresSimple ?? null,
    chambresDouble: row.chambresDouble ?? null,
    chambresAutre: row.chambresAutre ?? null,
    demiPension: row.demiPension ?? null,
    pensionComplete: row.pensionComplete ?? null,
    seminaireJournee: row.seminaireJournee ?? null,
    seminaireDemiJournee: row.seminaireDemiJournee ?? null,
    seminaireDetails: row.seminaireDetails ?? null,
    langue: row.langue ?? null,
    typeSejour: row.typeSejour ?? null,
    activiteUniquement: row.activiteUniquement ?? null,
  };
}

export async function submitHotelResponse(
  token: string,
  payload: {
    hotelName: string;
    respondentName?: string;
    message: string;
    wantsConfirmation?: boolean;
  }
): Promise<{
  hotelResponses: HotelResponse[];
  confirmation: HotelResponseConfirmation | null;
}> {
  const data = throwOnError(
    await supabase().rpc("submit_hotel_response", {
      p_token: token,
      p_hotel_name: payload.hotelName,
      p_respondent_name: payload.respondentName ?? null,
      p_message: payload.message,
      p_wants_confirmation: payload.wantsConfirmation ?? false,
    })
  );

  const result = Array.isArray(data) ? data[0] : data;
  return {
    hotelResponses: (result.hotelResponses ?? []).map(
      (r: Record<string, unknown>) => ({
        id: r.id as string,
        hotelName: r.hotelName as string,
        respondentName: r.respondentName as string | undefined,
        message: r.message as string,
        createdAt: r.createdAt as string | undefined,
      })
    ),
    confirmation: result.confirmation ?? null,
  };
}
