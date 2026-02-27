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

export function OfferMetaGrid({ offer, attachmentsCount }: OfferMetaGridProps) {
  const sections = [
    {
      title: "Informations société",
      items: [
        { label: "Type de société", value: offer.typeSociete },
        { label: "Pays", value: offer.pays },
        { label: "Langue", value: offer.langue },
        { label: "Transmis par", value: offer.transmisPar },
        { label: "Traité par", value: offer.traitePar },
      ],
    },
    {
      title: "Contact principal",
      items: [
        { label: "Titre du contact", value: offer.titreContact },
        { label: "Prénom du contact", value: offer.prenomContact },
        { label: "Nom du contact", value: offer.nomContact },
        { label: "Email du contact", value: offer.emailContact },
      ],
    },
    {
      title: "Séjour",
      items: [
        { label: "Type de séjour", value: offer.typeSejour },
        { label: "Catégorie d'hôtel", value: offer.categorieHotel },
        { label: "Station demandée", value: offer.stationDemandee },
        { label: "Nombre de nuits", value: offer.nombreDeNuits },
        { label: "Nombre de participants", value: offer.nombrePax },
        { label: "Séjour du", value: formatDate(offer.sejourDu) },
        { label: "Séjour au", value: formatDate(offer.sejourAu) },
      ],
    },
    {
      title: "Suivi de l'offre",
      items: [
        { label: "Date d'envoi de l'offre", value: formatDate(offer.dateEnvoiOffre) },
        { label: "Relance effectuée le", value: formatDate(offer.relanceEffectueeLe) },
        {
          label: "Réservation effectuée",
          value: formatBoolean(offer.reservationEffectuee),
        },
        {
          label: "Annexes",
          value: formatAttachments(attachmentsCount),
        },
      ],
    },
    {
      title: "Options",
      items: [
        {
          label: "Activités Villars/Diablerets",
          value: formatBoolean(offer.activitesVillarsDiablerets),
        },
        {
          label: "Contact saisi dans Brevo",
          value: formatBoolean(offer.contactEntreDansBrevo),
        },
      ],
    },
  ];

  return (
    <section className="space-y-6">
      {sections.map((section) => (
        <div
          key={section.title}
          className="rounded-lg border border-white/70 bg-white/90 p-5 shadow-sm ring-1 ring-white/60"
        >
          <div className="flex gap-3">
            <span className="h-9 w-1 rounded-full bg-gradient-to-b from-slate-900 to-slate-500" />
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                {section.title}
              </h3>
            </div>
          </div>
          <dl className="mt-4 grid gap-5 sm:grid-cols-2">
            {section.items.map((item) => (
              <InfoItem key={item.label} label={item.label} value={item.value} />
            ))}
          </dl>
        </div>
      ))}
      {offer.autres && (
        <div className="rounded-lg border border-white/70 bg-white/90 p-5 shadow-sm ring-1 ring-white/60">
          <div className="flex gap-3">
            <span className="h-9 w-1 rounded-full bg-gradient-to-b from-slate-900 to-slate-500" />
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Autres informations
              </h3>
            </div>
          </div>
          <p className="mt-4 text-sm text-slate-700">{offer.autres}</p>
        </div>
      )}
    </section>
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
