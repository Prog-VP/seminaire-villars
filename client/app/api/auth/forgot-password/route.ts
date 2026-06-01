import { NextResponse } from "next/server";
import { buildAccessEmail } from "@/features/users/access-email";
import {
  findAuthUserByEmail,
  getUserConfirmUrl,
  getUserRedirectTo,
  isValidUserEmail,
  normalizeUserEmail,
} from "@/features/users/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendMail } from "@/lib/mailer";

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as { email?: string };
    const email = normalizeUserEmail(body.email ?? "");

    if (!email || !isValidUserEmail(email)) {
      return NextResponse.json({ ok: true });
    }

    const admin = createAdminClient();
    const user = await findAuthUserByEmail(email, admin);

    if (!user?.email) {
      return NextResponse.json({ ok: true });
    }

    const { data, error } = await admin.auth.admin.generateLink({
      type: "recovery",
      email: user.email,
      options: {
        redirectTo: getUserRedirectTo(new URL(request.url).origin),
      },
    });

    if (error || !data.properties?.hashed_token) {
      throw new Error(error?.message ?? "Impossible de générer le lien de réinitialisation.");
    }

    const emailContent = buildAccessEmail("reset-password", {
      actionUrl: getUserConfirmUrl(
        new URL(request.url).origin,
        data.properties.hashed_token,
        "recovery"
      ),
      recipientEmail: user.email,
    });

    await sendMail({
      to: user.email,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[api/auth/forgot-password]", error);
    return NextResponse.json(
      { error: "Impossible d'envoyer l'email de réinitialisation." },
      { status: 500 }
    );
  }
}
