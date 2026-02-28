"use client";

import { useCallback, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { Offer } from "../types";

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
        {SUB_GROUPS.map((group) => {
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
              value={offer.categorieHotel?.split(",").filter(Boolean).join(", ") || undefined}
            />
            {offer.categorieHotelAutre && (
              <InfoItem label="Catégorie autre" value={offer.categorieHotelAutre} />
            )}
            <InfoItem label="Station demandée" value={offer.stationDemandee} />
            <InfoItem label="Nombre de nuits" value={offer.nombreDeNuits} />
            <InfoItem label="Nombre de participants" value={offer.nombrePax} />
            <InfoItem label="Séjour du" value={formatDate(offer.sejourDu)} />
            <InfoItem label="Séjour au" value={formatDate(offer.sejourAu)} />
          </dl>
        </MetaSection>
      )}

      {activeGroup === "finalisation" && (
        <div className="space-y-6">
          <MetaSection title="Suivi de l'offre">
            <dl className="mt-4 grid gap-5 sm:grid-cols-2">
              <InfoItem label="Date d'envoi de l'offre" value={formatDate(offer.dateEnvoiOffre)} />
              <InfoItem label="Relance effectuée le" value={formatDate(offer.relanceEffectueeLe)} />
              <InfoItem label="Réservation effectuée" value={formatBoolean(offer.reservationEffectuee)} />
              <InfoItem label="Annexes" value={formatAttachments(attachmentsCount)} />
            </dl>
          </MetaSection>

          <MetaSection title="Options">
            <dl className="mt-4 grid gap-5 sm:grid-cols-2">
              <InfoItem label="Activités Villars/Diablerets" value={formatBoolean(offer.activitesVillarsDiablerets)} />
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
