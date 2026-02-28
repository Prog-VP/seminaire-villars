import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type RouteContext = { params: Promise<{ id: string }> };

async function verifyAdmin() {
  const supabase = await createClient();
  const { data: roleData, error: roleError } = await supabase.rpc("get_my_role");
  if (roleError || roleData !== "admin") return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const currentUser = await verifyAdmin();
    if (!currentUser) {
      return NextResponse.json({ error: "Non autorisé." }, { status: 403 });
    }

    const { id } = await context.params;

    // Prevent self-deletion
    if (id === currentUser.id) {
      return NextResponse.json(
        { error: "Vous ne pouvez pas supprimer votre propre compte." },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const { error } = await admin.auth.admin.deleteUser(id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/users/[id]]", err);
    return NextResponse.json(
      { error: "Erreur interne du serveur." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const currentUser = await verifyAdmin();
    if (!currentUser) {
      return NextResponse.json({ error: "Non autorisé." }, { status: 403 });
    }

    const { id } = await context.params;
    const body = await request.json();
    const { email, role, nom, prenom } = body as {
      email?: string;
      role?: string;
      nom?: string;
      prenom?: string;
    };

    const admin = createAdminClient();

    // Update email if provided
    if (email) {
      const { error } = await admin.auth.admin.updateUserById(id, { email });
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }

    // Update profile fields (role, nom, prenom)
    const profileUpdate: Record<string, string> = {};
    if (role && ["admin", "standard"].includes(role)) profileUpdate.role = role;
    if (nom !== undefined) profileUpdate.nom = nom;
    if (prenom !== undefined) profileUpdate.prenom = prenom;

    if (Object.keys(profileUpdate).length > 0) {
      const { error } = await admin
        .from("profiles")
        .update(profileUpdate)
        .eq("id", id);
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/users/[id]]", err);
    return NextResponse.json(
      { error: "Erreur interne du serveur." },
      { status: 500 }
    );
  }
}
