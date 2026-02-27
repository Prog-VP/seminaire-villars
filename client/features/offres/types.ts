export type Offer = {
  id: string;
  societeContact: string;
  dateEnvoiOffre?: string | null;
  typeSociete: string;
  pays: string;
  emailContact?: string;
  langue?: string;
  titreContact?: string;
  nomContact?: string;
  prenomContact?: string;
  sejourDu?: string | null;
  sejourAu?: string | null;
  activitesVillarsDiablerets?: boolean;
  nombreDeNuits?: string;
  nombrePax?: number;
  transmisPar?: string;
  typeSejour?: string;
  categorieHotel?: string;
  stationDemandee?: string;
  relanceEffectueeLe?: string | null;
  reservationEffectuee?: boolean;
  contactEntreDansBrevo?: boolean;
  autres?: string;
  traitePar?: string;
  createdAt?: string;
  updatedAt?: string;
  shareToken?: string | null;
  hotelResponses?: HotelResponse[];
  comments?: OfferComment[];
  attachmentsCount?: number;
};

export type HotelResponse = {
  id?: string;
  hotelName: string;
  respondentName?: string;
  message: string;
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
