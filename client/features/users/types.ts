export type UserRole = "admin" | "standard";

export type UserProfile = {
  id: string;
  email: string;
  role: UserRole;
  created_at: string;
};
