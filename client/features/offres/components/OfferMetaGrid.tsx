"use client";

import { type ReactNode } from "react";
import type { Offer } from "../types";
import { formatStars, getEffectiveDates, computeNights, normalizeStatut } from "../utils";
import { formatDate } from "@/lib/format";

type OfferMetaGridProps = {
  offer: Offer;
  attachmentsCount?: number;
};

const formatBoolean = (value?: boolean) => (value ? "Oui" : "Non");

const formatAttachments = (count?: number) => {
  if (typeof count !== "number") return "—";
  if (count === 0) return "Aucune annexe";
  if (count === 1) return "1 annexe";
  return `${count} annexes`;
};

const SUB_GROUPS = [
  { key: "societe", label: "Société" },
  { key: "contact", label: "Contact" },
  { key: "sejour", label: "Séjour" },
  { key: "seminaire", label: "Séminaire" },
  { key: "finalisation", label: "Finalisation" },
] as const;

type SubGroupKey = (typeof SUB_GROUPS)[number]["key"];

const VALID_SECTIONS = SUB_GROUPS.map((g) => g.key) as unknown as readonly SubGroupKey[];

function parseSection(value: string | null): SubGroupKey {
  return VALID_SECTIONS.includes(value as SubGroupKey)
    ? (value as SubGroupKey)
    : "societe";
}

export { SUB_GROUPS, parseSection };
export type { SubGroupKey };

export function OfferMetaGrid({ offer, attachmentsCount, activeGroup = "societe" }: OfferMetaGridProps & { activeGroup?: SubGroupKey }) {
  const resolvedGroup = activeGroup;

  const effectiveDates = getEffectiveDates(offer);
  const hasMultipleOptions = (offer.dateOptions?.length ?? 0) > 1;
  const computedNights = hasMultipleOptions ? null : computeNights(effectiveDates.du, effectiveDates.au);

  return (
    <section className="space-y-4">

      {resolvedGroup === "societe" && (
        <MetaSection title="Informations société">
          <dl className="mt-4 grid gap-5 sm:grid-cols-2">
            <InfoItem label="Activité uniquement" value={formatBoolean(offer.activiteUniquement)} />
            <InfoItem label="Activités demandées" value={formatBoolean(offer.activitesDemandees)} />
            <InfoItem label="Type de société" value={offer.typeSociete} />
            <InfoItem label="Pays" value={offer.pays} />
            <InfoItem label="Langue" value={offer.langue} />
            {offer.activiteUniquement && (
              <InfoItem label="Nombre de participants" value={offer.nombrePax} />
            )}
            <InfoItem label="Transmis par" value={offer.transmisPar} />
            <InfoItem label="Traité par" value={offer.traitePar} />
          </dl>
        </MetaSection>
      )}

      {resolvedGroup === "contact" && (
        <MetaSection title="Contact principal">
          <dl className="mt-4 grid gap-5 sm:grid-cols-2">
            <InfoItem label="Titre du contact" value={offer.titreContact} />
            <InfoItem label="Prénom du contact" value={offer.prenomContact} />
            <InfoItem label="Nom du contact" value={offer.nomContact} />
            <InfoItem label="Email du contact" value={offer.emailContact} />
            <InfoItem label="Téléphone du contact" value={offer.telephoneContact} />
          </dl>
        </MetaSection>
      )}

      {resolvedGroup === "sejour" && (
        <MetaSection title="Séjour">
          <dl className="mt-4 grid gap-5 sm:grid-cols-2">
            <InfoItem label="Type de séjour" value={offer.typeSejour} />
            {!offer.activiteUniquement && (
              <InfoItem
                label="Catégorie d'hôtel"
                value={offer.categorieHotel?.split(",").filter(Boolean).map(formatStars).join(", ") || undefined}
              />
            )}
            {!offer.activiteUniquement && offer.categorieHotelAutre && (
              <InfoItem label="Catégorie autre" value={offer.categorieHotelAutre} />
            )}
            <InfoItem label="Station demandée" value={offer.stationDemandee} />
            {!offer.activiteUniquement && (
              <>
                <InfoItem label="Nombre de nuits" value={computedNights ?? undefined} />
                <InfoItem label="Nombre de participants" value={offer.nombrePax} />
                <InfoItem label="Chambres simple" value={offer.chambresSimple} />
                <InfoItem label="Chambres double" value={offer.chambresDouble} />
                <InfoItem label={`Chambres autre${offer.chambresAutrePrecision ? ` (${offer.chambresAutrePrecision})` : ""}`} value={offer.chambresAutre} />
                <InfoItem label="Demi-pension" value={formatBoolean(offer.demiPension)} />
                <InfoItem label="Pension complète" value={formatBoolean(offer.pensionComplete)} />
              </>
            )}
            {offer.dateOptions && offer.dateOptions.length > 0 ? (
              <div className="sm:col-span-2">
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Options de dates
                </dt>
                <dd className="mt-1 space-y-1">
                  {offer.dateOptions.map((opt, i) => {
                    const n = computeNights(opt.du || null, opt.au || null);
                    return (
                      <p key={i} className="text-sm text-slate-900">
                        <span className="font-medium text-slate-500">Option {i + 1} :</span>{" "}
                        {`${formatDate(opt.du)} → ${formatDate(opt.au)}`}
                        {n !== null && (
                          <span className="ml-2 text-xs text-slate-500">
                            ({n} nuit{n > 1 ? "s" : ""})
                          </span>
                        )}
                      </p>
                    );
                  })}
                </dd>
              </div>
            ) : null}
            {(offer.dateConfirmeeDu || offer.dateConfirmeeAu) && (
              <div className="sm:col-span-2">
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Date confirmée
                </dt>
                <dd className="mt-1 inline-flex items-center gap-2 text-sm text-slate-900">
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                    Confirmée
                  </span>
                  {formatDate(offer.dateConfirmeeDu)} → {formatDate(offer.dateConfirmeeAu)}
                </dd>
              </div>
            )}
          </dl>
        </MetaSection>
      )}

      {resolvedGroup === "seminaire" && (
        <MetaSection title="Séminaire">
          <dl className="mt-4 grid gap-5 sm:grid-cols-2">
            <InfoItem label="Journée" value={formatBoolean(offer.seminaireJournee)} />
            <InfoItem label="Demi-journée" value={formatBoolean(offer.seminaireDemiJournee)} />
            {offer.seminaireDetails && (
              <InfoItem label="Détails" value={offer.seminaireDetails} />
            )}
          </dl>
        </MetaSection>
      )}

      {resolvedGroup === "finalisation" && (
        <div className="space-y-6">
          <MetaSection title="Suivi de l'offre">
            <dl className="mt-4 grid gap-5 sm:grid-cols-2">
              <InfoItem label="Statut" value={normalizeStatut(offer.statut)} />
              <InfoItem label="Date d'envoi de l'offre" value={formatDate(offer.dateEnvoiOffre)} />
              <InfoItem label="Relance effectuée le" value={formatDate(offer.relanceEffectueeLe)} />
              <InfoItem label="Réservation effectuée" value={formatBoolean(offer.reservationEffectuee)} />
              <InfoItem label="Retour effectué aux hôtels" value={formatBoolean(offer.retourEffectueHotels)} />
              <InfoItem label="Annexes" value={formatAttachments(attachmentsCount)} />
            </dl>
          </MetaSection>

          <MetaSection title="Options">
            <dl className="mt-4 grid gap-5 sm:grid-cols-2">
              <InfoItem label="Contact saisi dans Brevo" value={formatBoolean(offer.contactEntreDansBrevo)} />
            </dl>
          </MetaSection>

        </div>
      )}
    </section>
  );
}

function MetaSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-white/70 bg-white/90 p-4 sm:p-5 shadow-sm ring-1 ring-white/60">
      <div className="flex gap-3">
        <span className="h-9 w-1 rounded-full bg-gradient-to-b from-brand-900 to-brand-500" />
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            {title}
          </h3>
        </div>
      </div>
      {children}
    </div>
  );
}

function InfoItem({
  label,
  value,
}: {
  label: string;
  value?: string | number | null | undefined;
}) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-slate-900">{value ?? "—"}</dd>
    </div>
  );
}
