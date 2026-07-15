import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  filterPptxSlides,
  type PptxHotelPlaceholderMap,
  type PptxPlaceholderMap,
} from "@/lib/pptx-filter";
import { buildAvailableOfferText } from "@/features/offres/utils";
import {
  formatOfferPptDestinationFilename,
  formatOfferPptDestinationLabel,
  normalizeOfferPptDestinations,
  normalizeOfferPptDestinationMode,
  resolveOfferPptDestinations,
  type OfferPptDestination,
} from "@/features/documents/offer-ppt-destinations";

type GenerateOfferPptBody = {
  offerId?: string;
  destinationMode?: string;
  responseHotels?: {
    responseId: string;
  }[];
};

type HotelSendRow = {
  hotels?: {
    nom?: string | null;
    ppt_tag?: string | null;
  } | null;
};

type HotelResponseRow = {
  id?: string | null;
  hotelName?: string | null;
  hotel_id?: string | null;
  offerText?: string | null;
  message?: string | null;
};

type HotelRow = {
  id: string;
  nom?: string | null;
  ppt_tag?: string | null;
  destination?: string | null;
};

type OfferRow = {
  id: string;
  numeroOffre?: string | null;
  societeContact?: string | null;
  emailContact?: string | null;
  telephoneContact?: string | null;
  titreContact?: string | null;
  nomContact?: string | null;
  prenomContact?: string | null;
  langue?: string | null;
  stationDemandee?: string | null;
  nombrePax?: number | null;
  nombreDeNuits?: string | null;
  typeSejour?: string | null;
  transmisPar?: string | null;
  dateEnvoiOffre?: string | null;
  createdAt?: string | null;
  dateConfirmeeDu?: string | null;
  dateConfirmeeAu?: string | null;
  dateOptions?: { du?: string | null; au?: string | null }[] | null;
  hotel_responses?: HotelResponseRow[] | null;
  offer_hotel_sends?: HotelSendRow[] | null;
};

const MASTER_POWERPOINT = {
  destination: "master",
  season: "powerpoint",
};

const LEGACY_MASTER_POWERPOINT_LANG = "master";

type MasterPowerPointLang = "FR" | "EN" | "DE";

type MasterRow = {
  name?: string | null;
  file_path?: string | null;
  lang?: string | null;
};

class BadRequestError extends Error {}

function normalizeToken(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase();
}

function normalizeLang(langue?: string | null): MasterPowerPointLang {
  const value = normalizeToken(langue ?? "");
  if (value.includes("EN") || value.includes("ANGLAIS")) return "EN";
  if (value.includes("DE") || value.includes("ALLEMAND")) return "DE";
  return "FR";
}

function dateToSeason(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const month = date.getUTCMonth() + 1;
  return month >= 11 || month <= 4 ? "HIVER" : "ETE";
}

function formatDate(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("fr-CH");
}

function formatDateForFilename(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const year = String(date.getUTCFullYear());
  return `${day}-${month}-${year}`;
}

function monthYearLocale(langue?: string | null) {
  const lang = normalizeLang(langue);
  if (lang === "EN") return "en-GB";
  if (lang === "DE") return "de-CH";
  return "fr-CH";
}

function formatMonthYear(value?: string | null, langue?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const formatted = new Intl.DateTimeFormat(monthYearLocale(langue), {
    month: "long",
    year: "numeric",
  }).format(date);
  return formatted.toLocaleUpperCase(monthYearLocale(langue));
}

function resolveDateRange(offer: OfferRow) {
  const from = offer.dateConfirmeeDu ?? offer.dateOptions?.[0]?.du ?? null;
  const to = offer.dateConfirmeeAu ?? offer.dateOptions?.[0]?.au ?? null;

  if (from && to) return `${formatDate(from)} - ${formatDate(to)}`;
  if (from) return formatDate(from);
  if (to) return formatDate(to);
  return "";
}

function resolveFilenameDateRange(offer: OfferRow) {
  const from = offer.dateConfirmeeDu ?? offer.dateOptions?.[0]?.du ?? null;
  const to = offer.dateConfirmeeAu ?? offer.dateOptions?.[0]?.au ?? null;
  const formattedFrom = formatDateForFilename(from);
  const formattedTo = formatDateForFilename(to);

  if (formattedFrom && formattedTo) return `${formattedFrom}_${formattedTo}`;
  return formattedFrom || formattedTo;
}

function resolveReferenceDate(offer: OfferRow) {
  return (
    offer.dateConfirmeeDu ??
    offer.dateOptions?.[0]?.du ??
    offer.dateEnvoiOffre ??
    offer.createdAt ??
    null
  );
}

function resolveSeasons(offer: OfferRow) {
  const seasons = new Set<string>();

  for (const value of [offer.dateConfirmeeDu, offer.dateConfirmeeAu]) {
    const season = dateToSeason(value);
    if (season) seasons.add(season);
  }

  for (const option of offer.dateOptions ?? []) {
    for (const value of [option.du, option.au]) {
      const season = dateToSeason(value);
      if (season) seasons.add(season);
    }
  }

  return [...seasons];
}

function buildFallbackHotelTag(name: string) {
  const stopwords = new Set(["A", "AU", "AUX", "D", "DE", "DES", "DU", "ET", "L", "LA", "LE", "LES"]);
  return normalizeToken(name)
    .replace(/[^A-Z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter((part) => part && !stopwords.has(part))
    .join("_");
}

function safeFilename(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 140) || "offre";
}

function buildOfferPptFilename(offer: OfferRow, destinations: OfferPptDestination[]) {
  const parts = [
    formatOfferPptDestinationFilename(destinations),
    offer.societeContact ?? "",
    offer.nombrePax != null ? `${offer.nombrePax}_pax` : "",
    resolveFilenameDateRange(offer),
  ].filter((part) => part.trim().length > 0);

  return `${safeFilename(parts.join("_") || offer.id)}.pptx`;
}

function buildPlaceholders(
  offer: OfferRow,
  generationDestinationLabel: string
): PptxPlaceholderMap {
  const contactFullName = [offer.prenomContact, offer.nomContact]
    .filter(Boolean)
    .join(" ");
  const referenceDate = resolveReferenceDate(offer);

  return {
    NUMERO_OFFRE: offer.numeroOffre ?? "",
    SOCIETE: offer.societeContact ?? "",
    ENTREPRISE: offer.societeContact ?? "",
    NOM_ENTREPRISE: offer.societeContact ?? "",
    CONTACT: contactFullName,
    NOM_CONTACT: offer.nomContact ?? "",
    PRENOM_CONTACT: offer.prenomContact ?? "",
    TITRE_CONTACT: offer.titreContact ?? "",
    EMAIL: offer.emailContact ?? "",
    EMAIL_CONTACT: offer.emailContact ?? "",
    TELEPHONE: offer.telephoneContact ?? "",
    TELEPHONE_CONTACT: offer.telephoneContact ?? "",
    NOMBRE_PAX: offer.nombrePax != null ? String(offer.nombrePax) : "",
    PARTICIPANTS: offer.nombrePax != null ? String(offer.nombrePax) : "",
    NOMBRE_NUITS: offer.nombreDeNuits ?? "",
    TYPE_SEJOUR: offer.typeSejour ?? "",
    TRANSMIS_PAR: offer.transmisPar ?? "",
    LANGUE: offer.langue ?? "",
    STATION: generationDestinationLabel,
    DESTINATION: generationDestinationLabel,
    STATION_DEMANDEE: offer.stationDemandee ?? "",
    DESTINATION_DEMANDEE: offer.stationDemandee ?? "",
    DATES: resolveDateRange(offer),
    DATE_DEBUT: formatDate(offer.dateConfirmeeDu ?? offer.dateOptions?.[0]?.du),
    DATE_FIN: formatDate(offer.dateConfirmeeAu ?? offer.dateOptions?.[0]?.au),
    DATE_CREATION: formatDate(offer.createdAt),
    DATE_ENVOI: formatDate(offer.dateEnvoiOffre),
    MOIS_ANNEE: formatMonthYear(referenceDate, offer.langue),
  };
}

function buildHotelReplacementMaps(
  offer: OfferRow,
  responseHotels: GenerateOfferPptBody["responseHotels"],
  hotelsById: Map<string, HotelRow>
) {
  const hasExplicitSelection = responseHotels !== undefined;
  const requestedByResponseId = new Map(
    (responseHotels ?? []).map((item) => [item.responseId, item])
  );
  const hotelTags = new Set<string>();
  const hotelDestinations = new Set<OfferPptDestination>();
  const hotelReplacements: PptxHotelPlaceholderMap = {};

  for (const response of offer.hotel_responses ?? []) {
    const responseId = response.id ?? "";
    const requested = responseId ? requestedByResponseId.get(responseId) : undefined;
    if (hasExplicitSelection && !requested) continue;

    const selectedHotelId = response.hotel_id ?? null;
    if (!selectedHotelId) {
      if (hasExplicitSelection && requested) {
        throw new BadRequestError(
          `Associez la réponse de ${response.hotelName ?? "cet hôtel"} à un hôtel avant de générer le PowerPoint.`
        );
      }
      continue;
    }
    const selectedHotel = hotelsById.get(selectedHotelId);
    if (!selectedHotel) {
      throw new BadRequestError(
        `L'hôtel associé à la réponse de ${response.hotelName ?? "cet hôtel"} est introuvable.`
      );
    }
    const hotelName = selectedHotel?.nom ?? response.hotelName ?? "";
    const tag =
      normalizeToken(selectedHotel?.ppt_tag ?? "") ||
      buildFallbackHotelTag(hotelName);

    if (!tag) continue;
    const offerText = buildAvailableOfferText(
      response.offerText ?? response.message ?? "",
    );
    if (!offerText) continue;

    hotelTags.add(tag);
    for (const destination of normalizeOfferPptDestinations(selectedHotel?.destination)) {
      hotelDestinations.add(destination);
    }
    hotelReplacements[tag] ??= {
      HOTEL: selectedHotel?.nom ?? response.hotelName ?? "",
      NOM_HOTEL: selectedHotel?.nom ?? response.hotelName ?? "",
      TEXTE_OFFRE: offerText,
    };
  }

  return {
    hotelTags: [...hotelTags],
    hotelDestinations: [...hotelDestinations],
    hotelReplacements,
  };
}

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    if (!user) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });

    const body = (await request.json()) as GenerateOfferPptBody;
    if (!body.offerId) {
      return NextResponse.json({ error: "Offre manquante." }, { status: 400 });
    }
    const destinationMode = normalizeOfferPptDestinationMode(body.destinationMode);

    const supabase = createAdminClient();
    const { data: offer, error: offerError } = await supabase
      .from("offers")
      .select("id, numeroOffre, societeContact, emailContact, telephoneContact, titreContact, nomContact, prenomContact, langue, stationDemandee, nombrePax, nombreDeNuits, typeSejour, transmisPar, dateEnvoiOffre, createdAt, dateConfirmeeDu, dateConfirmeeAu, dateOptions, hotel_responses(id, hotelName, hotel_id, offerText, message), offer_hotel_sends(hotels(nom, ppt_tag))")
      .eq("id", body.offerId)
      .single<OfferRow>();

    if (offerError || !offer) {
      return NextResponse.json({ error: "Offre introuvable." }, { status: 404 });
    }

    const masterLang = normalizeLang(offer.langue);
    const { data: masters, error: masterError } = await supabase
      .from("document_blocks")
      .select("name, file_path, lang")
      .eq("destination", MASTER_POWERPOINT.destination)
      .eq("season", MASTER_POWERPOINT.season)
      .in("lang", [masterLang, LEGACY_MASTER_POWERPOINT_LANG])
      .order("created_at", { ascending: false })
      .limit(10);
    const masterRows = (masters ?? []) as MasterRow[];
    const master =
      masterRows.find((row) => row.lang === masterLang) ??
      masterRows.find((row) => row.lang === LEGACY_MASTER_POWERPOINT_LANG) ??
      null;

    if (masterError || !master?.file_path) {
      return NextResponse.json(
        { error: `Aucun PowerPoint MASTER ${masterLang} n'est enregistré.` },
        { status: 404 }
      );
    }

    const { data: masterBlob, error: downloadError } = await supabase.storage
      .from("document-blocks")
      .download(master.file_path as string);

    if (downloadError || !masterBlob) {
      return NextResponse.json(
        { error: "Impossible de télécharger le PowerPoint MASTER." },
        { status: 500 }
      );
    }

    const selectedHotelIds = [
      ...new Set([
        ...(offer.hotel_responses ?? [])
          .filter((response) => {
            if (!body.responseHotels) return true;
            return body.responseHotels.some((item) => item.responseId === response.id);
          })
          .map((response) => response.hotel_id),
      ].filter(Boolean)),
    ] as string[];
    const { data: selectedHotels } = selectedHotelIds.length
      ? await supabase
          .from("hotels")
          .select("id, nom, ppt_tag, destination")
          .in("id", selectedHotelIds)
      : { data: [] };
    const hotelsById = new Map(
      ((selectedHotels ?? []) as HotelRow[]).map((hotel) => [hotel.id, hotel])
    );
    const { hotelTags, hotelDestinations, hotelReplacements } = buildHotelReplacementMaps(
      offer,
      body.responseHotels,
      hotelsById
    );
    const generationDestinations = resolveOfferPptDestinations({
      mode: destinationMode,
      hotelDestinations,
      offerDestination: offer.stationDemandee,
    });
    const generationDestinationLabel = formatOfferPptDestinationLabel(generationDestinations);

    const result = await filterPptxSlides(
      Buffer.from(new Uint8Array(await masterBlob.arrayBuffer())),
      {
        lang: masterLang,
        destinations: generationDestinations,
        seasons: resolveSeasons(offer),
        hotelTags,
      },
      buildPlaceholders(offer, generationDestinationLabel),
      hotelReplacements
    );

    const filename = buildOfferPptFilename(offer, generationDestinations);

    return new NextResponse(new Uint8Array(result.buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "X-PPTX-Master-Lang": masterLang,
        "X-PPTX-Destination-Mode": destinationMode,
        "X-PPTX-Destinations": generationDestinations.join(","),
        "X-PPTX-Kept-Slides": String(result.keptSlides),
        "X-PPTX-Removed-Slides": String(result.removedSlides),
      },
    });
  } catch (error) {
    console.error("[generate-offer-ppt]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur interne" },
      { status: error instanceof BadRequestError ? 400 : 500 }
    );
  }
}
