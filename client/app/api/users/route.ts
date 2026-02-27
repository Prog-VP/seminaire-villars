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
    const { email, password, role } = body as {
      email: string;
      password: string;
      role: UserRole;
    };

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email et mot de passe requis." },
        { status: 400 }
      );
    }
    if (role && !["admin", "standard"].includes(role)) {
      return NextResponse.json({ error: "Rôle invalide." }, { status: 400 });
    }

    // Create user via admin client
    const admin = createAdminClient();
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Set role if admin
    if (role === "admin" && data.user) {
      await admin
        .from("profiles")
        .update({ role: "admin" })
        .eq("id", data.user.id);
    }

    return NextResponse.json({
      id: data.user.id,
      email: data.user.email,
      role: role ?? "standard",
      created_at: data.user.created_at,
    });
  } catch {
    return NextResponse.json(
      { error: "Erreur interne du serveur." },
      { status: 500 }
    );
  }
}
