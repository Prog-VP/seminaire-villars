import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildAccessEmail } from "@/features/users/access-email";
import {
  findAuthUserByEmail,
  getUserRedirectTo,
  isValidUserEmail,
  isValidUserRole,
  listUsersForAdmin,
  normalizeUserEmail,
  requireAdminUser,
} from "@/features/users/server";
import { sendMail } from "@/lib/mailer";

export async function GET() {
  try {
    if (!(await requireAdminUser())) {
      return NextResponse.json({ error: "Non autorisé." }, { status: 403 });
    }

    const users = await listUsersForAdmin();
    return NextResponse.json(users);
  } catch (err) {
    console.error("[api/users][GET]", err);
    return NextResponse.json(
      { error: "Erreur interne du serveur." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!(await requireAdminUser())) {
      return NextResponse.json({ error: "Non autorisé." }, { status: 403 });
    }

    const body = await request.json();
    const { email, role, nom, prenom } = body as {
      email: string;
      role: string;
      nom?: string;
      prenom?: string;
    };
    const normalizedEmail = normalizeUserEmail(email ?? "");
    const normalizedNom = typeof nom === "string" ? nom.trim() : "";
    const normalizedPrenom = typeof prenom === "string" ? prenom.trim() : "";

    if (!normalizedEmail) {
      return NextResponse.json(
        { error: "Email requis." },
        { status: 400 }
      );
    }
    if (!isValidUserEmail(normalizedEmail)) {
      return NextResponse.json({ error: "Email invalide." }, { status: 400 });
    }
    if (!isValidUserRole(role)) {
      return NextResponse.json({ error: "Rôle invalide." }, { status: 400 });
    }

    const admin = createAdminClient();
    const existingUser = await findAuthUserByEmail(normalizedEmail, admin);
    if (existingUser) {
      return NextResponse.json(
        { error: "Un utilisateur avec cet email existe déjà." },
        { status: 400 }
      );
    }

    const redirectTo = getUserRedirectTo(request.nextUrl.origin);
    const { data, error } = await admin.auth.admin.generateLink({
      type: "invite",
      email: normalizedEmail,
      options: {
        redirectTo,
        data: { nom: normalizedNom, prenom: normalizedPrenom },
      },
    });

    if (error || !data.user?.id || !data.properties?.action_link) {
      return NextResponse.json(
        { error: error?.message ?? "Impossible de générer le lien d'invitation." },
        { status: 400 }
      );
    }

    try {
      const { error: profileError } = await admin
        .from("profiles")
        .upsert(
          {
            id: data.user.id,
            role,
            nom: normalizedNom,
            prenom: normalizedPrenom,
          },
          { onConflict: "id" }
        );

      if (profileError) {
        throw new Error(profileError.message);
      }

      const recipientName =
        [normalizedPrenom, normalizedNom].filter(Boolean).join(" ") || undefined;
      const emailContent = buildAccessEmail("invite", {
        actionUrl: data.properties.action_link,
        recipientEmail: normalizedEmail,
        recipientName,
      });

      await sendMail({
        to: normalizedEmail,
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text,
      });
    } catch (err) {
      const { error: cleanupError } = await admin.auth.admin.deleteUser(data.user.id);
      if (cleanupError) {
        console.error("[api/users][cleanup]", cleanupError);
      }
      throw err;
    }

    return NextResponse.json({
      id: data.user.id,
      email: data.user.email ?? normalizedEmail,
      role,
      nom: normalizedNom,
      prenom: normalizedPrenom,
      created_at: data.user.created_at,
      invited_at: data.user.invited_at ?? data.user.created_at,
      email_confirmed_at: null,
      last_sign_in_at: null,
      status: "invited",
    });
  } catch (err) {
    console.error("[api/users][POST]", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Erreur interne du serveur.",
      },
      { status: 500 }
    );
  }
}
