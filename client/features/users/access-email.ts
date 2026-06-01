import { escapeHtml } from "@/lib/mailer";

export type AccessEmailKind = "invite" | "complete-access" | "reset-password";

type AccessEmailParams = {
  actionUrl: string;
  recipientEmail: string;
  recipientName?: string;
};

type AccessEmailCopy = {
  subject: string;
  heading: string;
  intro: string;
  actionLabel: string;
  outro: string;
};

const APP_NAME = "Séminaire";

function getCopy(kind: AccessEmailKind): AccessEmailCopy {
  switch (kind) {
    case "invite":
      return {
        subject: "Invitation à rejoindre Séminaire",
        heading: "Votre accès a été créé",
        intro:
          "Un administrateur vous a invité à rejoindre l'application Séminaire. Choisissez maintenant votre mot de passe pour activer votre compte.",
        actionLabel: "Activer mon accès",
        outro:
          "Ce lien est temporaire et à usage unique. Si vous n'attendiez pas cet email, vous pouvez l'ignorer.",
      };
    case "complete-access":
      return {
        subject: "Finalisez votre accès à Séminaire",
        heading: "Votre invitation est toujours en attente",
        intro:
          "Votre compte existe déjà, mais l'accès n'a pas encore été finalisé. Utilisez ce lien pour définir votre mot de passe et terminer l'activation.",
        actionLabel: "Finaliser mon accès",
        outro:
          "Si le lien précédent a expiré ou n'a pas fonctionné, ce nouveau lien remplace l'ancien.",
      };
    case "reset-password":
      return {
        subject: "Réinitialisation de votre mot de passe Séminaire",
        heading: "Réinitialisez votre mot de passe",
        intro:
          "Une demande de réinitialisation de mot de passe a été effectuée pour votre compte Séminaire.",
        actionLabel: "Définir un nouveau mot de passe",
        outro:
          "Si vous n'êtes pas à l'origine de cette demande, contactez un administrateur et ignorez cet email.",
      };
  }
}

export function buildAccessEmail(
  kind: AccessEmailKind,
  { actionUrl, recipientEmail, recipientName }: AccessEmailParams
) {
  const copy = getCopy(kind);
  const safeName = recipientName ? escapeHtml(recipientName) : "";
  const greeting = safeName ? `<p>Bonjour ${safeName},</p>` : "<p>Bonjour,</p>";
  const safeEmail = escapeHtml(recipientEmail);

  return {
    subject: copy.subject,
    text: [
      safeName ? `Bonjour ${recipientName},` : "Bonjour,",
      "",
      copy.intro,
      "",
      `${copy.actionLabel}: ${actionUrl}`,
      "",
      copy.outro,
      "",
      `${APP_NAME} - ${safeEmail}`,
    ].join("\n"),
    html: `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; color: #0f172a;">
  <h1 style="font-size: 22px; margin-bottom: 16px;">${escapeHtml(copy.heading)}</h1>
  ${greeting}
  <p style="line-height: 1.6;">${escapeHtml(copy.intro)}</p>
  <p style="margin: 24px 0;">
    <a href="${actionUrl}" style="display: inline-block; background: #0f172a; color: #ffffff; text-decoration: none; padding: 12px 18px; border-radius: 8px; font-weight: 600;">
      ${escapeHtml(copy.actionLabel)}
    </a>
  </p>
  <p style="line-height: 1.6;">${escapeHtml(copy.outro)}</p>
  <p style="margin-top: 24px; color: #64748b; font-size: 13px;">
    Compte concerné: ${safeEmail}
  </p>
</div>`.trim(),
  };
}
