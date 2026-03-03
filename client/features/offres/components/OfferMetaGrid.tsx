"use client";

import { useCallback, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { Offer } from "../types";
import { formatStars, getEffectiveDates, computeNights, getStatutLabel } from "../utils";

type OfferMetaGridProps = {
  offer: Offer;
  attachmentsCount?: number;
};

const formatDate = (value?: string | null) =>
  value ? new Intl.DateTimeFormat("fr-CH").format(new Date(value)) : "—";

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

export function OfferMetaGrid({ offer, attachmentsCount }: OfferMetaGridProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeGroup = parseSection(searchParams.get("section"));

  const effectiveDates = getEffectiveDates(offer);
  const computedNights = computeNights(effectiveDates.du, effectiveDates.au);

  const visibleGroups = offer.activiteUniquement
    ? SUB_GROUPS.filter((g) => g.key !== "sejour" && g.key !== "seminaire")
    : SUB_GROUPS;

  const setActiveGroup = useCallback(
    (section: SubGroupKey) => {
      const params = new URLSearchParams(searchParams.toString());
      if (section === "societe") {
        params.delete("section");
      } else {
        params.set("section", section);
      }
      const qs = params.toString();
      router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
    },
    [router, pathname, searchParams]
  );

  return (
    <section className="space-y-4">
      <nav className="inline-flex rounded-lg bg-slate-100 p-1">
        {visibleGroups.map((group) => {
          const isActive = activeGroup === group.key;
          return (
            <button
              key={group.key}
              type="button"
              onClick={() => setActiveGroup(group.key)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-all ${
                isActive
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {group.label}
            </button>
          );
        })}
      </nav>

      {activeGroup === "societe" && (
        <MetaSection title="Informations société">
          <dl className="mt-4 grid gap-5 sm:grid-cols-2">
            <InfoItem label="Activité uniquement" value={formatBoolean(offer.activiteUniquement)} />
            <InfoItem label="Type de société" value={offer.typeSociete} />
            <InfoItem label="Pays" value={offer.pays} />
            <InfoItem label="Langue" value={offer.langue} />
            <InfoItem label="Transmis par" value={offer.transmisPar} />
            <InfoItem label="Traité par" value={offer.traitePar} />
          </dl>
        </MetaSection>
      )}

      {activeGroup === "contact" && (
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

      {activeGroup === "sejour" && (
        <MetaSection title="Séjour">
          <dl className="mt-4 grid gap-5 sm:grid-cols-2">
            <InfoItem label="Type de séjour" value={offer.typeSejour} />
            <InfoItem
              label="Catégorie d'hôtel"
              value={offer.categorieHotel?.split(",").filter(Boolean).map(formatStars).join(", ") || undefined}
            />
            {offer.categorieHotelAutre && (
              <InfoItem label="Catégorie autre" value={offer.categorieHotelAutre} />
            )}
            <InfoItem label="Station demandée" value={offer.stationDemandee} />
            <InfoItem label="Nombre de nuits" value={computedNights ?? offer.nombreDeNuits} />
            <InfoItem label="Nombre de participants" value={offer.nombrePax} />
            <InfoItem label="Chambres simple" value={offer.chambresSimple} />
            <InfoItem label="Chambres double" value={offer.chambresDouble} />
            <InfoItem label="Chambres autre" value={offer.chambresAutre} />
            {offer.dateOptions && offer.dateOptions.length > 0 ? (
              <div className="sm:col-span-2">
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Options de dates
                </dt>
                <dd className="mt-1 space-y-1">
                  {offer.dateOptions.map((opt, i) => (
                    <p key={i} className="text-sm text-slate-900">
                      <span className="font-medium text-slate-500">Option {i + 1} :</span>{" "}
                      {formatDate(opt.du)} → {formatDate(opt.au)}
                    </p>
                  ))}
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

      {activeGroup === "seminaire" && (
        <MetaSection title="Séminaire">
          <dl className="mt-4 grid gap-5 sm:grid-cols-2">
            <InfoItem label="Séminaire" value={formatBoolean(offer.seminaire)} />
            {offer.seminaire && (
              <>
                <InfoItem label="Journée" value={formatBoolean(offer.seminaireJournee)} />
                <InfoItem label="Demi-journée" value={formatBoolean(offer.seminaireDemiJournee)} />
                {offer.seminaireDetails && (
                  <InfoItem label="Détails" value={offer.seminaireDetails} />
                )}
              </>
            )}
          </dl>
        </MetaSection>
      )}

      {activeGroup === "finalisation" && (
        <div className="space-y-6">
          <MetaSection title="Suivi de l'offre">
            <dl className="mt-4 grid gap-5 sm:grid-cols-2">
              <InfoItem label="Statut" value={getStatutLabel(offer.statut)} />
              <InfoItem label="Relance effectuée le" value={formatDate(offer.relanceEffectueeLe)} />
              <InfoItem label="Réservation effectuée" value={formatBoolean(offer.reservationEffectuee)} />
              <InfoItem label="Annexes" value={formatAttachments(attachmentsCount)} />
            </dl>
          </MetaSection>

          <MetaSection title="Options">
            <dl className="mt-4 grid gap-5 sm:grid-cols-2">
              <InfoItem label="Contact saisi dans Brevo" value={formatBoolean(offer.contactEntreDansBrevo)} />
            </dl>
          </MetaSection>

          {offer.autres && (
            <MetaSection title="Autres informations">
              <p className="mt-4 text-sm text-slate-700">{offer.autres}</p>
            </MetaSection>
          )}
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
    <div className="rounded-lg border border-white/70 bg-white/90 p-5 shadow-sm ring-1 ring-white/60">
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
