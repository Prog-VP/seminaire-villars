import nodemailer from "nodemailer";

type MailPayload = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
};

function createTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) return null;

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

function getFromAddress() {
  return process.env.SMTP_FROM || process.env.SMTP_USER || "";
}

export async function sendMail({ to, subject, html, text }: MailPayload) {
  const transporter = createTransporter();
  const from = getFromAddress();

  if (!transporter || !from) {
    throw new Error("SMTP non configuré.");
  }

  await transporter.sendMail({
    from,
    to: Array.isArray(to) ? to.join(", ") : to,
    subject,
    html,
    text,
  });
}

export function escapeHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
