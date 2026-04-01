import type {
  Offer,
  DateOption,
  HotelResponse,
  OfferComment,
} from "../types";

export type SharedOfferResponse = {
  id: string;
  societeContact: string;
  dateOptions?: DateOption[];
  dateConfirmeeDu?: string | null;
  dateConfirmeeAu?: string | null;
  nombrePax?: number | null;
  nombreDeNuits?: string | null;
  chambresSimple?: number | null;
  chambresDouble?: number | null;
  chambresAutre?: number | null;
  chambresAutrePrecision?: string | null;
  demiPension?: boolean | null;
  pensionComplete?: boolean | null;
  seminaireJournee?: boolean | null;
  seminaireDemiJournee?: boolean | null;
  seminaireDetails?: string | null;
  langue?: string | null;
  typeSejour?: string | null;
  activiteUniquement?: boolean | null;
};

export function mapRow(row: Record<string, unknown>): Offer {
  const hotelResponses = Array.isArray(row.hotel_responses)
    ? (row.hotel_responses as Record<string, unknown>[]).map(mapHotelResponse)
    : [];

  const comments: OfferComment[] = Array.isArray(row.offer_comments)
    ? (row.offer_comments as Record<string, unknown>[]).map((c) => ({
        id: (c.id as string) ?? "",
        author: (c.author as string) ?? "",
        content: (c.content as string) ?? "",
        date: c.date as string | undefined,
        createdAt: c.createdAt as string | undefined,
      }))
    : [];

  let hotelSendsNames: string[] | undefined;
  let hotelSendsCount: number | undefined;
  if (Array.isArray(row.offer_hotel_sends)) {
    const sends = row.offer_hotel_sends as Record<string, unknown>[];
    hotelSendsNames = sends.map((s) => {
      const hotel = s.hotels as Record<string, unknown> | null;
      return (hotel?.nom as string) ?? "—";
    });
    hotelSendsCount = sends.length;
  }

  return {
    id: row.id as string,
    numeroOffre: row.numeroOffre as string | undefined,
    societeContact: row.societeContact as string,
    dateEnvoiOffre: (row.dateEnvoiOffre as string) ?? null,
    typeSociete: (row.typeSociete as string) ?? "",
    pays: (row.pays as string) ?? "",
    emailContact: row.emailContact as string | undefined,
    telephoneContact: row.telephoneContact as string | undefined,
    langue: row.langue as string | undefined,
    titreContact: row.titreContact as string | undefined,
    nomContact: row.nomContact as string | undefined,
    prenomContact: row.prenomContact as string | undefined,
    dateOptions: (row.dateOptions as DateOption[]) ?? [],
    dateConfirmeeDu: (row.dateConfirmeeDu as string) ?? null,
    dateConfirmeeAu: (row.dateConfirmeeAu as string) ?? null,
    activiteUniquement: row.activiteUniquement as boolean | undefined,
    activitesDemandees: row.activitesDemandees as boolean | undefined,
    nombreDeNuits: row.nombreDeNuits as string | undefined,
    nombrePax: row.nombrePax as number | undefined,
    chambresSimple: row.chambresSimple as number | undefined,
    chambresDouble: row.chambresDouble as number | undefined,
    chambresAutre: row.chambresAutre as number | undefined,
    chambresAutrePrecision: row.chambresAutrePrecision as string | undefined,
    transmisPar: row.transmisPar as string | undefined,
    typeSejour: row.typeSejour as string | undefined,
    categorieHotel: row.categorieHotel as string | undefined,
    categorieHotelAutre: row.categorieHotelAutre as string | undefined,
    stationDemandee: row.stationDemandee as string | undefined,
    relanceEffectueeLe: (row.relanceEffectueeLe as string) ?? null,
    reservationEffectuee: row.reservationEffectuee as boolean | undefined,
    retourEffectueHotels: row.retourEffectueHotels as boolean | undefined,
    contactEntreDansBrevo: row.contactEntreDansBrevo as boolean | undefined,
    demiPension: row.demiPension as boolean | undefined,
    pensionComplete: row.pensionComplete as boolean | undefined,
    seminaireJournee: row.seminaireJournee as boolean | undefined,
    seminaireDemiJournee: row.seminaireDemiJournee as boolean | undefined,
    seminaireDetails: row.seminaireDetails as string | undefined,
    traitePar: row.traitePar as string | undefined,
    createdAt: row.createdAt as string | undefined,
    updatedAt: row.updatedAt as string | undefined,
    shareToken: (row.shareToken as string) ?? null,
    hotelResponses,
    comments,
    attachmentsCount: undefined,
    statut: (row.statut as string) || "Brouillon",
    hotelSendsCount,
    hotelSendsNames,
  };
}

export function mapHotelResponse(row: Record<string, unknown>): HotelResponse {
  return {
    id: row.id as string,
    hotelName: row.hotelName as string,
    respondentName: row.respondentName as string | undefined,
    message: row.message as string,
    offerText: (row.offerText as string) ?? null,
    createdAt: row.createdAt as string | undefined,
  };
}

export function mapComment(row: Record<string, unknown>): OfferComment {
  return {
    id: row.id as string,
    author: row.author as string,
    content: row.content as string,
    date: row.date as string | undefined,
    createdAt: row.createdAt as string | undefined,
  };
}

export function mapSharedOfferRow(row: Record<string, unknown>): SharedOfferResponse {
  return {
    id: row.id as string,
    societeContact: row.societeContact as string,
    dateOptions: (row.dateOptions as DateOption[]) ?? [],
    dateConfirmeeDu: (row.dateConfirmeeDu as string) ?? null,
    dateConfirmeeAu: (row.dateConfirmeeAu as string) ?? null,
    nombrePax: (row.nombrePax as number) ?? null,
    nombreDeNuits: (row.nombreDeNuits as string) ?? null,
    chambresSimple: (row.chambresSimple as number) ?? null,
    chambresDouble: (row.chambresDouble as number) ?? null,
    chambresAutre: (row.chambresAutre as number) ?? null,
    chambresAutrePrecision: (row.chambresAutrePrecision as string) ?? null,
    demiPension: (row.demiPension as boolean) ?? null,
    pensionComplete: (row.pensionComplete as boolean) ?? null,
    seminaireJournee: (row.seminaireJournee as boolean) ?? null,
    seminaireDemiJournee: (row.seminaireDemiJournee as boolean) ?? null,
    seminaireDetails: (row.seminaireDetails as string) ?? null,
    langue: (row.langue as string) ?? null,
    typeSejour: (row.typeSejour as string) ?? null,
    activiteUniquement: (row.activiteUniquement as boolean) ?? null,
  };
}
