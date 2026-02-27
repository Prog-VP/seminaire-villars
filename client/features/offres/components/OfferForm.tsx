"use client";

import { useMemo, useState, type ReactNode } from "react";
import type { Offer } from "../types";
import { useSettings } from "@/features/settings/context";

type OfferFormValues = {
  societeContact: string;
  typeSociete: string;
  pays: string;
  nomContact: string;
  prenomContact: string;
  titreContact: string;
  emailContact: string;
  langue: string;
  typeSejour: string;
  categorieHotel: string;
  stationDemandee: string;
  nombreDeNuits: string;
  nombrePax: string;
  sejourDu: string;
  sejourAu: string;
  autres: string;
  transmisPar: string;
  traitePar: string;
  activitesVillarsDiablerets: boolean;
  reservationEffectuee: boolean;
  contactEntreDansBrevo: boolean;
  dateEnvoiOffre: string;
  relanceEffectueeLe: string;
};

export const defaultOfferFormValues: OfferFormValues = {
  societeContact: "",
  typeSociete: "Agence",
  pays: "CH",
  nomContact: "",
  prenomContact: "",
  titreContact: "M.",
  emailContact: "",
  langue: "Français",
  typeSejour: "Séminaire",
  categorieHotel: "4*",
  stationDemandee: "Villars",
  nombreDeNuits: "",
  nombrePax: "",
  sejourDu: "",
  sejourAu: "",
  autres: "",
  transmisPar: "",
  traitePar: "",
  activitesVillarsDiablerets: false,
  reservationEffectuee: false,
  contactEntreDansBrevo: false,
  dateEnvoiOffre: "",
  relanceEffectueeLe: "",
};

export type OfferFormProps = {
  initialValues?: Partial<OfferFormValues>;
  onSubmit: (values: OfferFormValues) => Promise<void>;
  submitLabel: string;
  onCancel?: () => void;
  cancelLabel?: string;
  heading?: string;
  subheading?: string;
  showFollowUpFields?: boolean;
  onDelete?: () => void;
  deleteLabel?: string;
  isDeleteLoading?: boolean;
};

export function OfferForm({
  initialValues,
  submitLabel,
  onSubmit,
  onCancel,
  cancelLabel = "Annuler",
  heading,
  subheading,
  showFollowUpFields = true,
  onDelete,
  deleteLabel = "Supprimer",
  isDeleteLoading = false,
}: OfferFormProps) {
  const [formState, setFormState] = useState<OfferFormValues>({
    ...defaultOfferFormValues,
    ...initialValues,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckbox = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = event.target;
    setFormState((prev) => ({ ...prev, [name]: checked }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit(formState);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Une erreur est survenue.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const { options } = useSettings();

  const paysChoices = useMemo(
    () => mergeOption(options.pays, formState.pays),
    [options.pays, formState.pays]
  );
  const typeSocieteChoices = useMemo(
    () => mergeOption(options.typeSociete, formState.typeSociete),
    [options.typeSociete, formState.typeSociete]
  );
  const langueChoices = useMemo(
    () => mergeOption(options.langue, formState.langue),
    [options.langue, formState.langue]
  );
  const titreChoices = useMemo(
    () => mergeOption(options.titreContact, formState.titreContact),
    [options.titreContact, formState.titreContact]
  );
  const typeSejourChoices = useMemo(
    () => mergeOption(options.typeSejour, formState.typeSejour),
    [options.typeSejour, formState.typeSejour]
  );
  const categorieChoices = useMemo(
    () => mergeOption(options.categorieHotel, formState.categorieHotel),
    [options.categorieHotel, formState.categorieHotel]
  );
  const stationChoices = useMemo(
    () => mergeOption(options.stationDemandee, formState.stationDemandee),
    [options.stationDemandee, formState.stationDemandee]
  );
  const traiteParChoices = useMemo(
    () => mergeOption(options.traitePar, formState.traitePar),
    [options.traitePar, formState.traitePar]
  );
  const transmisParChoices = useMemo(
    () => mergeOption(options.transmisPar, formState.transmisPar),
    [options.transmisPar, formState.transmisPar]
  );

  const inputClass =
    "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500";
  const checkboxClass =
    "h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-200";

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      {(heading || subheading) && (
        <header className="mb-6">
          {heading && (
            <h2 className="text-2xl font-semibold text-slate-900">{heading}</h2>
          )}
          {subheading && <p className="text-sm text-slate-600">{subheading}</p>}
        </header>
      )}

      <ActionButtons
        onCancel={onCancel}
        cancelLabel={cancelLabel}
        deleteLabel={deleteLabel}
        isDeleteLoading={isDeleteLoading}
        isSubmitting={isSubmitting}
        submitLabel={submitLabel}
        className="mb-6"
      />

      <div className="space-y-8">
        <FormSection title="Informations société">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Société de contact" required>
              <input
                name="societeContact"
                value={formState.societeContact}
                onChange={handleChange}
                className={inputClass}
                required
              />
            </Field>

            <Field label="Type de société" required>
              <select
                name="typeSociete"
                value={formState.typeSociete}
                onChange={handleChange}
                className={inputClass}
                required
              >
                {typeSocieteChoices.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Pays" required>
              <select
                name="pays"
                value={formState.pays}
                onChange={handleChange}
                className={inputClass}
                required
              >
                {paysChoices.map((pays) => (
                  <option key={pays} value={pays}>
                    {pays}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Langue">
              <select
                name="langue"
                value={formState.langue}
                onChange={handleChange}
                className={inputClass}
              >
                {langueChoices.map((langue) => (
                  <option key={langue} value={langue}>
                    {langue}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </FormSection>

        <FormSection title="Contact principal" description="Coordonnées directes de votre interlocuteur.">
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Titre">
              <select
                name="titreContact"
                value={formState.titreContact}
                onChange={handleChange}
                className={inputClass}
              >
                {titreChoices.map((titre) => (
                  <option key={titre} value={titre}>
                    {titre}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Prénom du contact" required>
              <input
                name="prenomContact"
                value={formState.prenomContact}
                onChange={handleChange}
                className={inputClass}
                required
              />
            </Field>

            <Field label="Nom du contact" required>
              <input
                name="nomContact"
                value={formState.nomContact}
                onChange={handleChange}
                className={inputClass}
                required
              />
            </Field>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Email du contact">
              <input
                name="emailContact"
                type="email"
                value={formState.emailContact}
                onChange={handleChange}
                className={inputClass}
              />
            </Field>

            <Field label="Transmis par">
              <select
                name="transmisPar"
                value={formState.transmisPar}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="">Non renseigné</option>
                {transmisParChoices.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </FormSection>

        <FormSection title="Séjour" description="Informations sur la demande reçue.">
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Type de séjour">
              <select
                name="typeSejour"
                value={formState.typeSejour}
                onChange={handleChange}
                className={inputClass}
              >
                {typeSejourChoices.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Catégorie d'hôtel">
              <select
                name="categorieHotel"
                value={formState.categorieHotel}
                onChange={handleChange}
                className={inputClass}
              >
                {categorieChoices.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Station demandée">
              <select
                name="stationDemandee"
                value={formState.stationDemandee}
                onChange={handleChange}
                className={inputClass}
              >
                {stationChoices.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Nombre de nuits">
              <input
                name="nombreDeNuits"
                value={formState.nombreDeNuits}
                onChange={handleChange}
                className={inputClass}
              />
            </Field>

            <Field label="Nombre de participants">
              <input
                name="nombrePax"
                value={formState.nombrePax}
                onChange={handleChange}
                className={inputClass}
                type="number"
                min={0}
              />
            </Field>

            <Field label="Traité par">
              <select
                name="traitePar"
                value={formState.traitePar}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="">Non défini</option>
                {traiteParChoices.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Séjour du">
              <input
                type="date"
                name="sejourDu"
                value={formState.sejourDu}
                onChange={handleChange}
                className={inputClass}
              />
            </Field>

            <Field label="Séjour au">
              <input
                type="date"
                name="sejourAu"
                value={formState.sejourAu}
                onChange={handleChange}
                className={inputClass}
              />
            </Field>
          </div>
        </FormSection>

        <FormSection title="Suivi de l'offre">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Date d'envoi de l'offre">
              <input
                type="date"
                name="dateEnvoiOffre"
                value={formState.dateEnvoiOffre}
                onChange={handleChange}
                className={inputClass}
              />
            </Field>

            {showFollowUpFields && (
              <Field label="Relance effectuée le">
                <input
                  type="date"
                  name="relanceEffectueeLe"
                  value={formState.relanceEffectueeLe}
                  onChange={handleChange}
                  className={inputClass}
                />
              </Field>
            )}
          </div>
        </FormSection>

        <FormSection title="Options">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Activités Villars / Diablerets">
              <input
                type="checkbox"
                name="activitesVillarsDiablerets"
                checked={formState.activitesVillarsDiablerets}
                onChange={handleCheckbox}
                className={checkboxClass}
              />
            </Field>

            {showFollowUpFields && (
              <Field label="Réservation effectuée">
                <input
                  type="checkbox"
                  name="reservationEffectuee"
                  checked={formState.reservationEffectuee}
                  onChange={handleCheckbox}
                  className={checkboxClass}
                />
              </Field>
            )}

            <Field label="Contact saisi dans Brevo">
              <input
                type="checkbox"
                name="contactEntreDansBrevo"
                checked={formState.contactEntreDansBrevo}
                onChange={handleCheckbox}
                className={checkboxClass}
              />
            </Field>
          </div>
        </FormSection>

        <FormSection title="Autres informations">
          <Field label="Autres">
            <textarea
              name="autres"
              value={formState.autres}
              onChange={handleChange}
              rows={3}
              className={inputClass}
            />
          </Field>
        </FormSection>
      </div>

      {error && (
        <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <ActionButtons
        onCancel={onCancel}
        cancelLabel={cancelLabel}
        onDelete={onDelete}
        deleteLabel={deleteLabel}
        isDeleteLoading={isDeleteLoading}
        isSubmitting={isSubmitting}
        submitLabel={submitLabel}
        className="mt-6"
      />
    </form>
  );
}

function Field({
  label,
  children,
  required,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
      <span>
        {label}
        {required && <span className="text-red-500"> *</span>}
      </span>
      {children}
    </label>
  );
}

function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-5">
      <div className="flex gap-3">
        <span className="h-9 w-1 rounded-full bg-gradient-to-b from-slate-900 to-slate-500" />
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {title}
          </p>
          {description && <p className="text-sm text-slate-500">{description}</p>}
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

export function mapFormValuesToPayload(values: OfferFormValues) {
  return {
    ...values,
    nombrePax: values.nombrePax ? Number(values.nombrePax) : undefined,
    sejourDu: values.sejourDu ? new Date(values.sejourDu).toISOString() : undefined,
    sejourAu: values.sejourAu ? new Date(values.sejourAu).toISOString() : undefined,
    dateEnvoiOffre: values.dateEnvoiOffre
      ? new Date(values.dateEnvoiOffre).toISOString()
      : undefined,
    relanceEffectueeLe: values.relanceEffectueeLe
      ? new Date(values.relanceEffectueeLe).toISOString()
      : undefined,
  } satisfies Partial<Offer>;
}

export function mapOfferToFormValues(offer: Offer): OfferFormValues {
  return {
    societeContact: offer.societeContact || "",
    typeSociete: offer.typeSociete || "Agence",
    pays: offer.pays || "CH",
    nomContact: offer.nomContact || "",
    prenomContact: offer.prenomContact || "",
    titreContact: offer.titreContact || "M.",
    emailContact: offer.emailContact || "",
    langue: offer.langue || "Français",
    typeSejour: offer.typeSejour || "Séminaire",
    categorieHotel: offer.categorieHotel || "4*",
    stationDemandee: offer.stationDemandee || "Villars",
    nombreDeNuits: offer.nombreDeNuits || "",
    nombrePax: offer.nombrePax?.toString() || "",
    sejourDu: offer.sejourDu ? offer.sejourDu.slice(0, 10) : "",
    sejourAu: offer.sejourAu ? offer.sejourAu.slice(0, 10) : "",
    autres: offer.autres || "",
    transmisPar: offer.transmisPar || "",
    traitePar: offer.traitePar || "",
    activitesVillarsDiablerets: offer.activitesVillarsDiablerets ?? false,
    reservationEffectuee: offer.reservationEffectuee ?? false,
    contactEntreDansBrevo: offer.contactEntreDansBrevo ?? false,
    dateEnvoiOffre: offer.dateEnvoiOffre ? offer.dateEnvoiOffre.slice(0, 10) : "",
    relanceEffectueeLe: offer.relanceEffectueeLe ? offer.relanceEffectueeLe.slice(0, 10) : "",
  };
}

function mergeOption(options: string[], currentValue?: string | null) {
  if (!currentValue) {
    return options;
  }
  return options.includes(currentValue) ? options : [...options, currentValue];
}

function ActionButtons({
  onCancel,
  cancelLabel,
  onDelete,
  deleteLabel,
  isDeleteLoading,
  isSubmitting,
  submitLabel,
  className = "",
}: {
  onCancel?: () => void;
  cancelLabel: string;
  onDelete?: () => void;
  deleteLabel: string;
  isDeleteLoading: boolean;
  isSubmitting: boolean;
  submitLabel: string;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end ${className}`}
    >
      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          disabled={isDeleteLoading || isSubmitting}
          className="rounded-lg px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isDeleteLoading ? "Suppression..." : deleteLabel}
        </button>
      )}
      {onCancel && (
        <button
          type="button"
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
          onClick={onCancel}
        >
          {cancelLabel}
        </button>
      )}
      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting ? "Enregistrement..." : submitLabel}
      </button>
    </div>
  );
}
