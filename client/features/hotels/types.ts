export type Hotel = {
  id: string;
  nom: string;
  email: string | null;
  created_at: string;
};

export type HotelDocument = {
  id: string;
  hotelId: string;
  lang: string;
  filePath: string;
  createdAt: string;
};
