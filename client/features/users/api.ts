import { createClient } from "@/lib/supabase/client";
import type { UserProfile, UserRole } from "./types";

function supabase() {
  return createClient();
}

export type MyProfile = { role: UserRole; nom: string; prenom: string };

export async function fetchMyProfile(): Promise<MyProfile> {
  const { data, error } = await supabase().rpc("get_my_profile");
  if (error) throw new Error(error.message);
  const row = Array.isArray(data) ? data[0] : data;
  return {
    role: (row?.role as UserRole) ?? "standard",
    nom: (row?.nom as string) ?? "",
    prenom: (row?.prenom as string) ?? "",
  };
}

export async function fetchMyRole(): Promise<UserRole> {
  const profile = await fetchMyProfile();
  return profile.role;
}

export async function fetchUsersWithRoles(): Promise<UserProfile[]> {
  const { data, error } = await supabase().rpc("get_users_with_roles");
  if (error) throw new Error(error.message);
  return (data as UserProfile[]) ?? [];
}

export async function createUser(
  email: string,
  password: string,
  role: UserRole,
  nom?: string,
  prenom?: string
): Promise<UserProfile> {
  const res = await fetch("/api/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, role, nom, prenom }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Impossible de créer l'utilisateur.");
  }
  return res.json();
}

export async function deleteUser(id: string): Promise<void> {
  const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Impossible de supprimer l'utilisateur.");
  }
}

export async function updateUser(
  id: string,
  payload: { email?: string; role?: UserRole; nom?: string; prenom?: string }
): Promise<void> {
  const res = await fetch(`/api/users/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Impossible de mettre à jour l'utilisateur.");
  }
}
