import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildAccessEmail } from "@/features/users/access-email";
import { getUserRedirectTo, requireAdminUser } from "@/features/users/server";
import { sendMail } from "@/lib/mailer";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    if (!(await requireAdminUser())) {
      return NextResponse.json({ error: "Non autorisé." }, { status: 403 });
    }

    const { id } = await context.params;
    const admin = createAdminClient();

    const { data: userData, error: userError } = await admin.auth.admin.getUserById(id);
    if (userError || !userData.user?.email) {
      return NextResponse.json({ error: "Utilisateur introuvable." }, { status: 404 });
    }

    if (
      userData.user.last_sign_in_at ||
      userData.user.email_confirmed_at ||
      userData.user.confirmed_at
    ) {
      return NextResponse.json(
        { error: "Ce compte est déjà actif. Utilisez le reset mot de passe." },
        { status: 400 }
      );
    }

    const { data: linkData, error } = await admin.auth.admin.generateLink({
      type: "recovery",
      email: userData.user.email,
      options: {
        redirectTo: getUserRedirectTo(request.nextUrl.origin),
      },
    });

    if (error || !linkData.properties?.action_link) {
      return NextResponse.json(
        { error: error?.message ?? "Impossible de générer le lien d'activation." },
        { status: 400 }
      );
    }

    const { data: profile } = await admin
      .from("profiles")
      .select("nom, prenom")
      .eq("id", id)
      .maybeSingle();

    const recipientName =
      [
        typeof profile?.prenom === "string" ? profile.prenom.trim() : "",
        typeof profile?.nom === "string" ? profile.nom.trim() : "",
      ]
        .filter(Boolean)
        .join(" ") || undefined;

    const emailContent = buildAccessEmail("complete-access", {
      actionUrl: linkData.properties.action_link,
      recipientEmail: userData.user.email,
      recipientName,
    });

    await sendMail({
      to: userData.user.email,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/users/[id]/invite]", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Erreur interne du serveur.",
      },
      { status: 500 }
    );
  }
}
