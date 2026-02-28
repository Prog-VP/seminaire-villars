export type UserRole = "admin" | "standard";

export type UserProfile = {
  id: string;
  email: string;
  role: UserRole;
  nom: string;
  prenom: string;
  created_at: string;
};
