export type Hotel = {
  id: string;
  nom: string;
  email: string | null;
  created_at: string;
};

export type { HotelDocument } from "@/features/documents/types";
