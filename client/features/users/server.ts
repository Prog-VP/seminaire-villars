import type { User } from "@supabase/auth-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getUserStatus } from "./status";
import type { UserProfile, UserRole } from "./types";

type AdminClient = ReturnType<typeof createAdminClient>;

type ProfileRow = {
  id: string;
  role: UserRole | null;
  nom: string | null;
  prenom: string | null;
};

const USER_EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function requireAdminUser() {
  const supabase = await createClient();
  const { data: roleData, error: roleError } = await supabase.rpc("get_my_role");
  if (roleError || roleData !== "admin") return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

export function normalizeUserEmail(email: string) {
  return email.trim().toLowerCase();
}

export function isValidUserEmail(email: string) {
  return USER_EMAIL_REGEX.test(email);
}

export function isValidUserRole(role: string): role is UserRole {
  return role === "admin" || role === "standard";
}

export function getUserRedirectTo(origin: string) {
  return `${process.env.NEXT_PUBLIC_SITE_URL ?? origin}/reset-password`;
}

export async function listAllAuthUsers(admin: AdminClient = createAdminClient()) {
  const users: User[] = [];
  let page = 1;

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 200,
    });

    if (error) {
      throw new Error(error.message);
    }

    users.push(...data.users.filter((user) => !user.deleted_at));

    if (!data.nextPage) break;
    page = data.nextPage;
  }

  return users;
}

export async function findAuthUserByEmail(
  email: string,
  admin: AdminClient = createAdminClient()
) {
  const normalizedEmail = normalizeUserEmail(email);
  const users = await listAllAuthUsers(admin);

  return (
    users.find((user) => normalizeUserEmail(user.email ?? "") === normalizedEmail) ??
    null
  );
}

export async function listUsersForAdmin(
  admin: AdminClient = createAdminClient()
): Promise<UserProfile[]> {
  const authUsers = await listAllAuthUsers(admin);
  const userIds = authUsers.map((user) => user.id);

  const profilesById = new Map<string, ProfileRow>();
  if (userIds.length > 0) {
    const { data: profiles, error } = await admin
      .from("profiles")
      .select("id, role, nom, prenom")
      .in("id", userIds);

    if (error) {
      throw new Error(error.message);
    }

    for (const profile of (profiles ?? []) as ProfileRow[]) {
      profilesById.set(profile.id, profile);
    }
  }

  return authUsers
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
    .map((user) => {
      const profile = profilesById.get(user.id);
      return {
        id: user.id,
        email: user.email ?? "",
        role: profile?.role ?? "standard",
        nom: profile?.nom ?? "",
        prenom: profile?.prenom ?? "",
        created_at: user.created_at,
        invited_at: user.invited_at ?? null,
        email_confirmed_at: user.email_confirmed_at ?? user.confirmed_at ?? null,
        last_sign_in_at: user.last_sign_in_at ?? null,
        status: getUserStatus(user),
      };
    });
}
