import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const supabase = await createClient();
    const { data: roleData, error: roleError } = await supabase.rpc("get_my_role");
    if (roleError || roleData !== "admin") {
      return NextResponse.json({ error: "Non autorisé." }, { status: 403 });
    }

    const { id } = await context.params;
    const admin = createAdminClient();

    // Get the user's email
    const { data: userData, error: userError } = await admin.auth.admin.getUserById(id);
    if (userError || !userData.user?.email) {
      return NextResponse.json({ error: "Utilisateur introuvable." }, { status: 404 });
    }

    // Send password reset email via Supabase
    const { error } = await supabase.auth.resetPasswordForEmail(userData.user.email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? request.nextUrl.origin}/reset-password`,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/users/[id]/reset-password]", err);
    return NextResponse.json(
      { error: "Erreur interne du serveur." },
      { status: 500 }
    );
  }
}
