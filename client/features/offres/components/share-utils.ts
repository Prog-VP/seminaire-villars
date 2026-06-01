import { getEffectiveDates } from "@/features/offres/utils";
import type { Offer } from "../types";
import type { Hotel } from "@/features/hotels/types";

export type ShareEmailTemplate = {
  subject: string;
  body: string;
};

export const SHARE_EMAIL_TEMPLATE_KEYS = {
  subject: "share_email_subject",
  body: "share_email_body",
} as const;

export const DEFAULT_SHARE_EMAIL_TEMPLATE: ShareEmailTemplate = {
  subject: "{client}, {participants}, {dates_courtes}",
  body: [
    "Cher Partenaire,",
    "",
    "Nous avons reçu une nouvelle demande {type_sejour} pour le {dates_courtes}, transmise par le {transmis_par}.",
    "",
    "Nous vous serions reconnaissants de bien vouloir compléter le formulaire ci-dessous avec vos disponibilités et vos tarifs :",
    "{lien}",
    "",
    "Pour toute question ou précision, n’hésitez pas à nous contacter par téléphone.",
    "",
    "Nous vous remercions par avance pour votre retour d’ici à {date_jour}.",
    "",
    "Dans l’attente de votre réponse, nous vous adressons nos meilleures salutations.",
  ].join("\n"),
};

const LEGACY_DEFAULT_SHARE_EMAIL_TEMPLATE: ShareEmailTemplate = {
  subject: "Nouvelle demande d'offre – {client}",
  body: [
    "Bonjour,",
    "",
    "Nous avons une nouvelle demande d'offre {dates}.",
    "",
    "Merci d'avance de compléter votre offre via le lien ci-dessous :",
    "{lien}",
    "",
    "Cordialement,",
  ].join("\n"),
};

export function normalizeShareEmailTemplate(template: ShareEmailTemplate): ShareEmailTemplate {
  if (
    template.subject === LEGACY_DEFAULT_SHARE_EMAIL_TEMPLATE.subject &&
    template.body === LEGACY_DEFAULT_SHARE_EMAIL_TEMPLATE.body
  ) {
    return DEFAULT_SHARE_EMAIL_TEMPLATE;
  }

  return template;
}

const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString("fr-CH") : "?";

const fmtDateTime = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString("fr-CH") : "";

function getDateLine(offer: Offer) {
  const eff = getEffectiveDates(offer);

  return (
    offer.dateOptions && offer.dateOptions.length > 1
      ? `pour les dates suivantes :\n${offer.dateOptions.map((opt, i) => `  Option ${i + 1} : du ${fmtDate(opt.du)} au ${fmtDate(opt.au)}`).join("\n")}`
      : `pour le ${fmtDate(eff.du)} au ${fmtDate(eff.au)}`
  );
}

function getShortDates(offer: Offer) {
  const eff = getEffectiveDates(offer);

  return (
    offer.dateOptions && offer.dateOptions.length > 1
      ? offer.dateOptions
          .map((opt, i) => `Option ${i + 1}: ${fmtDate(opt.du)} - ${fmtDate(opt.au)}`)
          .join(", ")
      : `${fmtDate(eff.du)} - ${fmtDate(eff.au)}`
  );
}

function applyShareEmailTemplate(
  value: string,
  offer: Offer,
  hotel: Hotel,
  shareUrl: string | null
) {
  const replacements: Record<string, string> = {
    client: offer.societeContact,
    dates: getDateLine(offer),
    dates_courtes: getShortDates(offer),
    date_creation: fmtDateTime(offer.createdAt),
    date_jour: new Date().toLocaleDateString("fr-CH"),
    hotel: hotel.nom,
    lien: shareUrl ?? "",
    participants:
      typeof offer.nombrePax === "number"
        ? `${offer.nombrePax} participant${offer.nombrePax > 1 ? "s" : ""}`
        : "participants non renseignés",
    station: offer.stationDemandee ?? "",
    transmis_par: offer.transmisPar ?? "non renseigné",
    type_sejour: offer.typeSejour ?? "de séjour",
  };

  return value.replace(
    /\{(client|dates|dates_courtes|date_creation|date_jour|hotel|lien|participants|station|transmis_par|type_sejour)\}/g,
    (_, key: string) => replacements[key] ?? ""
  );
}

export function buildMailto(
  offer: Offer,
  hotel: Hotel,
  shareUrl: string | null,
  template: ShareEmailTemplate = DEFAULT_SHARE_EMAIL_TEMPLATE
): string {
  const normalizedTemplate = normalizeShareEmailTemplate(template);
  const subject = applyShareEmailTemplate(normalizedTemplate.subject, offer, hotel, shareUrl);
  const body = applyShareEmailTemplate(normalizedTemplate.body, offer, hotel, shareUrl);
  const cc = hotel.email_cc ? `&cc=${encodeURIComponent(hotel.email_cc)}` : "";
  return `mailto:${encodeURIComponent(hotel.email ?? "")}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}${cc}`;
}
