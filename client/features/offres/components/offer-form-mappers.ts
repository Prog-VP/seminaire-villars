import type { Offer, DateOption } from "../types";
import type { OfferFormValues } from "./offer-form-types";
import { getEffectiveDates, computeNights } from "../utils";

export function mapFormValuesToPayload(values: OfferFormValues) {
  const dateOptions: DateOption[] = values.dateOptions.filter(
    (opt) => opt.du || opt.au
  );
  const effective = getEffectiveDates({
    dateOptions,
    dateConfirmeeDu: values.dateConfirmeeDu || null,
    dateConfirmeeAu: values.dateConfirmeeAu || null,
  });

  const nights = computeNights(effective.du, effective.au);

  return {
    ...values,
    activiteUniquement: values.activiteUniquement,
    nombreDeNuits: nights !== null ? String(nights) : "",
    nombrePax: values.nombrePax ? Number(values.nombrePax) : undefined,
    chambresSimple: values.chambresSimple ? Number(values.chambresSimple) : undefined,
    chambresDouble: values.chambresDouble ? Number(values.chambresDouble) : undefined,
    chambresAutre: values.chambresAutre ? Number(values.chambresAutre) : undefined,
    dateOptions,
    dateConfirmeeDu: values.dateConfirmeeDu
      ? new Date(values.dateConfirmeeDu).toISOString()
      : null,
    dateConfirmeeAu: values.dateConfirmeeAu
      ? new Date(values.dateConfirmeeAu).toISOString()
      : null,
    dateEnvoiOffre: values.dateEnvoiOffre || null,
    relanceEffectueeLe: values.relanceEffectueeLe
      ? new Date(values.relanceEffectueeLe).toISOString()
      : undefined,
    statut: values.statut || "Brouillon",
  } satisfies Partial<Offer>;
}

export function mapOfferToFormValues(offer: Offer): OfferFormValues {
  let dateOptions: { du: string; au: string }[] =
    offer.dateOptions?.map((opt) => ({
      du: opt.du ? opt.du.slice(0, 10) : "",
      au: opt.au ? opt.au.slice(0, 10) : "",
    })) ?? [];

  if (dateOptions.length === 0) {
    dateOptions = [{ du: "", au: "" }];
  }

  return {
    activiteUniquement: offer.activiteUniquement ?? false,
    societeContact: offer.societeContact || "",
    typeSociete: offer.typeSociete || "",
    pays: offer.pays || "",
    nomContact: offer.nomContact || "",
    prenomContact: offer.prenomContact || "",
    titreContact: offer.titreContact || "",
    emailContact: offer.emailContact || "",
    telephoneContact: offer.telephoneContact || "",
    langue: offer.langue || "",
    typeSejour: offer.typeSejour || "",
    categorieHotel: offer.categorieHotel || "",
    categorieHotelAutre: offer.categorieHotelAutre || "",
    stationDemandee: offer.stationDemandee || "",
    nombrePax: offer.nombrePax?.toString() || "",
    chambresSimple: offer.chambresSimple?.toString() || "",
    chambresDouble: offer.chambresDouble?.toString() || "",
    chambresAutre: offer.chambresAutre?.toString() || "",
    dateOptions,
    dateConfirmeeDu: offer.dateConfirmeeDu ? offer.dateConfirmeeDu.slice(0, 10) : "",
    dateConfirmeeAu: offer.dateConfirmeeAu ? offer.dateConfirmeeAu.slice(0, 10) : "",
    autres: offer.autres || "",
    transmisPar: offer.transmisPar || "",
    traitePar: offer.traitePar || "",
    seminaire: offer.seminaire ?? false,
    seminaireJournee: offer.seminaireJournee ?? false,
    seminaireDemiJournee: offer.seminaireDemiJournee ?? false,
    seminaireDetails: offer.seminaireDetails || "",
    reservationEffectuee: offer.reservationEffectuee ?? false,
    retourEffectueHotels: offer.retourEffectueHotels ?? false,
    contactEntreDansBrevo: offer.contactEntreDansBrevo ?? false,
    dateEnvoiOffre: offer.dateEnvoiOffre ? offer.dateEnvoiOffre.slice(0, 10) : "",
    relanceEffectueeLe: offer.relanceEffectueeLe ? offer.relanceEffectueeLe.slice(0, 10) : "",
    statut: offer.statut || "Brouillon",
  };
}
