import { getEffectiveDates, computeNights, formatApproxDate } from "@/features/offres/utils";
import type { Offer } from "../types";
import type { Hotel } from "@/features/hotels/types";

const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString("fr-CH") : "?";

export function buildMailto(offer: Offer, hotel: Hotel, shareUrl: string | null): string {
  const eff = getEffectiveDates(offer);
  const firstOpt = offer.dateOptions?.[0];
  const nights = computeNights(eff.du, eff.au, firstOpt?.approximatif);

  const fmtOpt = (opt: { du: string; au: string; approximatif?: boolean }) =>
    opt.approximatif ? formatApproxDate(opt.du) : `du ${fmtDate(opt.du)} au ${fmtDate(opt.au)}`;

  const subject = firstOpt?.approximatif
    ? `Demande de disponibilité – ${offer.societeContact} – ${formatApproxDate(eff.du ?? "")}`
    : `Demande de disponibilité – ${offer.societeContact} – ${fmtDate(eff.du)} au ${fmtDate(eff.au)}`;

  const dateOptionsText =
    offer.dateOptions && offer.dateOptions.length > 0
      ? offer.dateOptions
          .map((opt, i) => `  Option ${i + 1} : ${fmtOpt(opt)}`)
          .join("\n")
      : `  Du ${fmtDate(eff.du)} au ${fmtDate(eff.au)}`;

  const lines = [
    `Bonjour,`,
    ``,
    `Pourriez-vous nous faire parvenir une offre pour le séjour suivant :`,
    ``,
    `Client : ${offer.societeContact}`,
    `Type : ${offer.typeSejour || "Non défini"}`,
    ...(offer.dateOptions && offer.dateOptions.length > 1
      ? [`Dates (${offer.dateOptions.length} options) :`, dateOptionsText]
      : [`Dates : du ${fmtDate(eff.du)} au ${fmtDate(eff.au)}`]),
    ...(nights ? [`Nombre de nuits : ${nights}`] : []),
    ...(offer.nombrePax ? [`Participants : ${offer.nombrePax}`] : []),
    ...(offer.chambresSimple || offer.chambresDouble
      ? [
          `Chambres : ${[
            offer.chambresSimple ? `${offer.chambresSimple} simple(s)` : "",
            offer.chambresDouble ? `${offer.chambresDouble} double(s)` : "",
            offer.chambresAutre ? `${offer.chambresAutre} autre(s)` : "",
          ]
            .filter(Boolean)
            .join(", ")}`,
        ]
      : []),
    ...(offer.seminaire
      ? [`Séminaire : Oui${offer.seminaireDetails ? ` – ${offer.seminaireDetails}` : ""}`]
      : []),
    ``,
    `Merci de remplir votre offre via ce lien :`,
    shareUrl ?? "",
    ``,
    `Cordialement,`,
  ];

  const body = lines.join("\n");
  return `mailto:${encodeURIComponent(hotel.email ?? "")}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
