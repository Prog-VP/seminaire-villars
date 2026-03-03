import { createClient } from "@/lib/supabase/client";
import type {
  BrochureTemplate,
  OfferBrochure,
  BrochureSection,
  PublicBrochureData,
} from "./types";
import type { HotelResponse } from "@/features/offres/types";
import { parseHotelResponseMessage } from "@/features/offres/utils";
import { matchHotelSlug, extractHotelResponseData, sectionId } from "./utils";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function supabase() {
  return createClient();
}

function throwOnError<T>(result: {
  data: T;
  error: { message: string } | null;
}): T {
  if (result.error) throw new Error(result.error.message);
  return result.data;
}

function mapTemplate(row: Record<string, unknown>): BrochureTemplate {
  return {
    id: row.id as string,
    destination: row.destination as string,
    lang: row.lang as string,
    sections: (row.sections as BrochureSection[]) ?? [],
    createdAt: row.created_at as string | undefined,
    updatedAt: row.updated_at as string | undefined,
  };
}

function mapBrochure(row: Record<string, unknown>): OfferBrochure {
  return {
    id: row.id as string,
    offerId: row.offer_id as string,
    destination: row.destination as string,
    lang: row.lang as string,
    sections: (row.sections as BrochureSection[]) ?? [],
    createdAt: row.created_at as string | undefined,
    updatedAt: row.updated_at as string | undefined,
  };
}

// ---------------------------------------------------------------------------
// Templates CRUD
// ---------------------------------------------------------------------------

export async function fetchBrochureTemplates(): Promise<BrochureTemplate[]> {
  const data = throwOnError(
    await supabase()
      .from("brochure_templates")
      .select("*")
      .order("destination")
      .order("lang")
  );
  return (data ?? []).map(mapTemplate);
}

export async function fetchBrochureTemplate(
  destination: string,
  lang: string
): Promise<BrochureTemplate | null> {
  const { data, error } = await supabase()
    .from("brochure_templates")
    .select("*")
    .eq("destination", destination)
    .eq("lang", lang)
    .single();

  if (error || !data) return null;
  return mapTemplate(data);
}

export async function updateBrochureTemplate(
  id: string,
  sections: BrochureSection[]
): Promise<void> {
  throwOnError(
    await supabase()
      .from("brochure_templates")
      .update({ sections } as Record<string, unknown>)
      .eq("id", id)
  );
}

// ---------------------------------------------------------------------------
// Offer brochures CRUD
// ---------------------------------------------------------------------------

export async function fetchOfferBrochure(
  offerId: string
): Promise<OfferBrochure | null> {
  const { data, error } = await supabase()
    .from("offer_brochures")
    .select("*")
    .eq("offer_id", offerId)
    .single();

  if (error || !data) return null;
  return mapBrochure(data);
}

/**
 * Creates a new offer brochure by copying from the base template and injecting
 * hotel response data for selected responses.
 */
export async function createOfferBrochure(
  offerId: string,
  destination: string,
  lang: string,
  hotelResponses?: HotelResponse[]
): Promise<OfferBrochure> {
  // 1. Fetch the base template
  const template = await fetchBrochureTemplate(destination, lang);
  let sections: BrochureSection[] = template
    ? JSON.parse(JSON.stringify(template.sections))
    : [];

  // 2. Inject hotel response data
  if (hotelResponses && hotelResponses.length > 0) {
    for (const response of hotelResponses) {
      const slug = matchHotelSlug(response.hotelName);
      const parsed = parseHotelResponseMessage(response.message);
      const responseData = extractHotelResponseData(parsed);

      // Try to find an existing hotel section in the template
      const existingIndex = sections.findIndex(
        (s) => s.type === "hotel" && s.metadata?.hotelSlug === slug
      );

      if (existingIndex >= 0 && slug) {
        // Mark as enabled and inject dynamic data
        sections[existingIndex].enabled = true;
        sections[existingIndex].metadata = {
          ...sections[existingIndex].metadata,
          hotelResponseData: responseData,
        };
      } else {
        // Create a new basic hotel section from the response
        const newSection: BrochureSection = {
          id: sectionId("hotel", slug ?? response.hotelName.toLowerCase().replace(/\s+/g, "-")),
          type: "hotel",
          enabled: true,
          title: response.hotelName,
          content: "",
          images: [],
          metadata: {
            hotelSlug: slug ?? undefined,
            hotelResponseData: responseData,
          },
        };
        // Insert hotel sections before contacts/footer type sections
        const contactsIdx = sections.findIndex(
          (s) => s.type === "contacts" || s.type === "ski"
        );
        if (contactsIdx >= 0) {
          sections.splice(contactsIdx, 0, newSection);
        } else {
          sections.push(newSection);
        }
      }
    }
  }

  // 3. Save to DB
  const data = throwOnError(
    await supabase()
      .from("offer_brochures")
      .insert({
        offer_id: offerId,
        destination,
        lang,
        sections,
      })
      .select("*")
      .single()
  );

  if (!data) throw new Error("Création de la brochure échouée.");
  return mapBrochure(data);
}

export async function updateOfferBrochure(
  offerId: string,
  sections: BrochureSection[]
): Promise<void> {
  throwOnError(
    await supabase()
      .from("offer_brochures")
      .update({ sections } as Record<string, unknown>)
      .eq("offer_id", offerId)
  );
}

export async function deleteOfferBrochure(offerId: string): Promise<void> {
  throwOnError(
    await supabase().from("offer_brochures").delete().eq("offer_id", offerId)
  );
}

// ---------------------------------------------------------------------------
// Public RPC (anonymous access via share token)
// ---------------------------------------------------------------------------

export async function getOfferBrochurePublic(
  token: string
): Promise<PublicBrochureData | null> {
  const { data, error } = await supabase().rpc("get_offer_brochure", {
    p_token: token,
  });

  if (error || !data) return null;

  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return null;

  return {
    id: row.id,
    numeroOffre: row.numeroOffre ?? null,
    societeContact: row.societeContact,
    stationDemandee: row.stationDemandee ?? null,
    langue: row.langue ?? null,
    brochure: row.brochure
      ? {
          id: row.brochure.id,
          destination: row.brochure.destination,
          lang: row.brochure.lang,
          sections: row.brochure.sections ?? [],
          updatedAt: row.brochure.updatedAt ?? undefined,
        }
      : null,
  };
}
