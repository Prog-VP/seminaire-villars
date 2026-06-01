import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildAccessEmail } from "@/features/users/access-email";
import { getUserConfirmUrl, getUserRedirectTo, requireAdminUser } from "@/features/users/server";
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

    const { data: linkData, error } = await admin.auth.admin.generateLink({
      type: "recovery",
      email: userData.user.email,
      options: {
        redirectTo: getUserRedirectTo(request.nextUrl.origin),
      },
    });

    if (error || !linkData.properties?.hashed_token) {
      return NextResponse.json(
        { error: error?.message ?? "Impossible de générer le lien de réinitialisation." },
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

    const emailContent = buildAccessEmail("reset-password", {
      actionUrl: getUserConfirmUrl(
        request.nextUrl.origin,
        linkData.properties.hashed_token,
        "recovery"
      ),
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
    console.error("[api/users/[id]/reset-password]", err);
    return NextResponse.json(
      { error: "Erreur interne du serveur." },
      { status: 500 }
    );
  }
}
