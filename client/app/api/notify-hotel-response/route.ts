import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { createAdminClient } from "@/lib/supabase/admin";

type NotifyBody =
  | { test: true }
  | {
      offerId: string;
      hotelName: string;
      respondentName?: string;
      message: string;
    };

async function getSmtpConfig(supabase: ReturnType<typeof createAdminClient>) {
  const { data } = await supabase.from("app_config").select("key, value");
  const map: Record<string, string> = {};
  for (const row of data ?? []) {
    map[row.key] = row.value;
  }
  return map;
}

async function getRecipients(supabase: ReturnType<typeof createAdminClient>) {
  const { data } = await supabase
    .from("settings")
    .select("label")
    .eq("type", "emailNotification");
  return (data ?? []).map((row) => row.label);
}

function buildTransporter(config: Record<string, string>) {
  const host = config.smtp_host;
  const port = Number(config.smtp_port) || 587;
  const user = config.smtp_user;
  const pass = config.smtp_pass;

  if (!host || !user || !pass) return null;

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as NotifyBody;
    const supabase = createAdminClient();

    const config = await getSmtpConfig(supabase);
    const recipients = await getRecipients(supabase);
    const from = config.smtp_from || config.smtp_user;

    const transporter = buildTransporter(config);
    if (!transporter || recipients.length === 0) {
      return NextResponse.json({
        ok: true,
        message: "SMTP non configuré ou aucun destinataire.",
      });
    }

    if ("test" in body && body.test) {
      await transporter.sendMail({
        from,
        to: recipients.join(", "),
        subject: "Test de configuration SMTP – Séminaire",
        html: `<p>Ceci est un email de test envoyé depuis l'application Séminaire.</p>
<p>Si vous recevez ce message, la configuration SMTP est correcte.</p>`,
      });
      return NextResponse.json({ ok: true, message: "Email test envoyé avec succès." });
    }

    const { offerId, hotelName, respondentName, message } = body as Exclude<
      NotifyBody,
      { test: true }
    >;

    // Fetch the offer to get client name
    let clientName = "";
    const { data: offer } = await supabase
      .from("offers")
      .select('"societeContact"')
      .eq("id", offerId)
      .single();
    if (offer) {
      clientName = (offer as Record<string, string>).societeContact ?? "";
    }

    const subject = `Nouvelle réponse hôtel – ${hotelName}${clientName ? ` – Offre ${clientName}` : ""}`;

    const dashboardUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/offres/${offerId}?tab=responses`;

    const html = `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px;">
  <h2 style="color: #1e293b;">Nouvelle réponse hôtel</h2>
  <table style="border-collapse: collapse; width: 100%; margin: 16px 0;">
    <tr>
      <td style="padding: 8px 12px; color: #64748b; font-size: 13px;">Hôtel</td>
      <td style="padding: 8px 12px; font-weight: 600;">${escapeHtml(hotelName)}</td>
    </tr>
    ${respondentName ? `<tr>
      <td style="padding: 8px 12px; color: #64748b; font-size: 13px;">Contact</td>
      <td style="padding: 8px 12px;">${escapeHtml(respondentName)}</td>
    </tr>` : ""}
    ${clientName ? `<tr>
      <td style="padding: 8px 12px; color: #64748b; font-size: 13px;">Client</td>
      <td style="padding: 8px 12px;">${escapeHtml(clientName)}</td>
    </tr>` : ""}
  </table>
  <div style="background: #f8fafc; border-radius: 8px; padding: 16px; margin: 16px 0; white-space: pre-line; font-size: 14px; color: #334155;">
    ${escapeHtml(message)}
  </div>
  ${dashboardUrl ? `<p><a href="${dashboardUrl}" style="color: #2563eb;">Voir dans le dashboard</a></p>` : ""}
</div>`;

    await transporter.sendMail({
      from,
      to: recipients.join(", "),
      subject,
      html,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[notify-hotel-response]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur interne" },
      { status: 500 }
    );
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
