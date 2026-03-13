import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { UserRole } from "@/features/users/types";

export async function POST(request: NextRequest) {
  try {
    // Verify caller is admin
    const supabase = await createClient();
    const { data: roleData, error: roleError } = await supabase.rpc("get_my_role");
    if (roleError || roleData !== "admin") {
      return NextResponse.json({ error: "Non autorisé." }, { status: 403 });
    }

    const body = await request.json();
    const { email, role, nom, prenom } = body as {
      email: string;
      role: UserRole;
      nom?: string;
      prenom?: string;
    };

    if (!email) {
      return NextResponse.json(
        { error: "Email requis." },
        { status: 400 }
      );
    }
    if (role && !["admin", "standard"].includes(role)) {
      return NextResponse.json({ error: "Rôle invalide." }, { status: 400 });
    }

    // Invite user — they receive an email to set their password
    const admin = createAdminClient();
    const redirectTo = `${process.env.NEXT_PUBLIC_SITE_URL ?? request.nextUrl.origin}/reset-password`;
    const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
      redirectTo,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Update profile fields (role, nom, prenom)
    if (data.user) {
      const profileUpdate: Record<string, string> = {};
      if (role === "admin") profileUpdate.role = "admin";
      if (nom) profileUpdate.nom = nom;
      if (prenom) profileUpdate.prenom = prenom;

      if (Object.keys(profileUpdate).length > 0) {
        await admin
          .from("profiles")
          .update(profileUpdate)
          .eq("id", data.user.id);
      }
    }

    return NextResponse.json({
      id: data.user.id,
      email: data.user.email,
      role: role ?? "standard",
      nom: nom ?? "",
      prenom: prenom ?? "",
      created_at: data.user.created_at,
    });
  } catch {
    return NextResponse.json(
      { error: "Erreur interne du serveur." },
      { status: 500 }
    );
  }
}
