import type { UserStatus } from "./status";

export type UserRole = "admin" | "standard";

export type UserProfile = {
  id: string;
  email: string;
  role: UserRole;
  nom: string;
  prenom: string;
  created_at: string;
  invited_at: string | null;
  email_confirmed_at: string | null;
  last_sign_in_at: string | null;
  status: UserStatus;
};
