export type DocumentBlock = {
  id: string;
  destination: string;  // 'villars' | 'diablerets'
  season: string;       // 'ete' | 'hiver'
  lang: string;         // 'fr' | 'en' | 'de'
  name: string;
  filePath: string;
  createdAt: string;
};

export type HotelDocument = {
  id: string;
  hotelId: string;
  lang: string;
  filePath: string;
  createdAt: string;
};
