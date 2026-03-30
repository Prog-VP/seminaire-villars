export type DateOption = {
  du: string;
  au: string;
};

export type Offer = {
  id: string;
  numeroOffre?: string;
  societeContact: string;
  dateEnvoiOffre?: string | null;
  typeSociete: string;
  pays: string;
  emailContact?: string;
  telephoneContact?: string;
  langue?: string;
  titreContact?: string;
  nomContact?: string;
  prenomContact?: string;
  dateOptions?: DateOption[];
  dateConfirmeeDu?: string | null;
  dateConfirmeeAu?: string | null;
  activiteUniquement?: boolean;
  activitesDemandees?: boolean;
  nombreDeNuits?: string;
  nombrePax?: number;
  chambresSimple?: number;
  chambresDouble?: number;
  chambresAutre?: number;
  transmisPar?: string;
  typeSejour?: string;
  categorieHotel?: string;
  categorieHotelAutre?: string;
  stationDemandee?: string;
  relanceEffectueeLe?: string | null;
  reservationEffectuee?: boolean;
  retourEffectueHotels?: boolean;
  contactEntreDansBrevo?: boolean;
  demiPension?: boolean;
  pensionComplete?: boolean;
  seminaireJournee?: boolean;
  seminaireDemiJournee?: boolean;
  seminaireDetails?: string;
  traitePar?: string;
  createdAt?: string;
  updatedAt?: string;
  shareToken?: string | null;
  hotelResponses?: HotelResponse[];
  comments?: OfferComment[];
  attachmentsCount?: number;
  statut?: string;
  hotelSendsCount?: number;
  hotelSendsNames?: string[];
};

export type HotelResponse = {
  id?: string;
  hotelName: string;
  respondentName?: string;
  message: string;
  offerText?: string | null;
  createdAt?: string;
};

export type HotelResponseConfirmation = {
  client: string;
  stay: {
    from: string;
    to: string;
  };
  participants?: number | null;
  hotel: string;
  contact?: string | null;
  message: string;
  submittedAt: string;
};

export type OfferAttachment = {
  id: string;
  filename: string;
  length: number;
  contentType?: string | null;
  uploadedAt: string;
};

export type OfferComment = {
  id: string;
  author: string;
  content: string;
  date?: string;
  createdAt?: string;
};

export type OfferHotelSend = {
  id: string;
  hotelId: string;
  hotelName: string;
  hotelEmail: string | null;
  sentAt: string;
};

export type ParsedHotelResponse = {
  dateFrom: string | null;
  dateTo: string | null;
  roomsSimple: string | null;
  roomsDouble: string | null;
  priceChf: string | null;
  priceEur: string | null;
  forfaitChf: string | null;
  forfaitEur: string | null;
  taxeChf: string | null;
  taxeEur: string | null;
  raw: string;
};

