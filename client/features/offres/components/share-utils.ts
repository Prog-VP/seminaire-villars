import { getEffectiveDates } from "@/features/offres/utils";
import type { Offer } from "../types";
import type { Hotel } from "@/features/hotels/types";

const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString("fr-CH") : "?";

export function buildMailto(offer: Offer, hotel: Hotel, shareUrl: string | null): string {
  const eff = getEffectiveDates(offer);

  const subject = `Nouvelle demande d'offre – ${offer.societeContact}`;

  const dateLine =
    offer.dateOptions && offer.dateOptions.length > 1
      ? `pour les dates suivantes :\n${offer.dateOptions.map((opt, i) => `  Option ${i + 1} : du ${fmtDate(opt.du)} au ${fmtDate(opt.au)}`).join("\n")}`
      : `pour le ${fmtDate(eff.du)} au ${fmtDate(eff.au)}`;

  const lines = [
    `Bonjour,`,
    ``,
    `Nous avons une nouvelle demande d'offre ${dateLine}.`,
    ``,
    `Merci d'avance de compléter votre offre via le lien ci-dessous :`,
    shareUrl ?? "",
    ``,
    `Cordialement,`,
  ];

  const body = lines.join("\n");
  const cc = hotel.email_cc ? `&cc=${encodeURIComponent(hotel.email_cc)}` : "";
  return `mailto:${encodeURIComponent(hotel.email ?? "")}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}${cc}`;
}
