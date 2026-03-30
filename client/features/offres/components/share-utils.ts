import { getEffectiveDates, computeNights } from "@/features/offres/utils";
import type { Offer } from "../types";
import type { Hotel } from "@/features/hotels/types";

const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString("fr-CH") : "?";

export function buildMailto(offer: Offer, hotel: Hotel, shareUrl: string | null): string {
  const eff = getEffectiveDates(offer);

  const fmtOpt = (opt: { du: string; au: string }) => {
    const base = `du ${fmtDate(opt.du)} au ${fmtDate(opt.au)}`;
    const n = computeNights(opt.du || null, opt.au || null);
    return n !== null ? `${base} (${n} nuit${n > 1 ? "s" : ""})` : base;
  };

  const subject = `Demande de disponibilité – ${offer.societeContact} – ${fmtDate(eff.du)} au ${fmtDate(eff.au)}`;

  const dateOptionsText =
    offer.dateOptions && offer.dateOptions.length > 0
      ? offer.dateOptions
          .map((opt, i) => `  Option ${i + 1} : ${fmtOpt(opt)}`)
          .join("\n")
      : `  Du ${fmtDate(eff.du)} au ${fmtDate(eff.au)}`;

  // Only show a single "Nombre de nuits" line when there's exactly one option
  const singleNights = offer.dateOptions?.length === 1
    ? computeNights(eff.du, eff.au)
    : null;

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
    ...(singleNights ? [`Nombre de nuits : ${singleNights}`] : []),
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
    ...((offer.seminaireJournee || offer.seminaireDemiJournee)
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
