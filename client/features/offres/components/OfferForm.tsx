"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Offer, DateOption } from "../types";
import { fetchCategorieHotelAutreSuggestions } from "../api";
import { useSettings } from "@/features/settings/context";
import { formatStars, getEffectiveDates, computeNights } from "../utils";

type OfferFormValues = {
  activiteUniquement: boolean;
  societeContact: string;
  typeSociete: string;
  pays: string;
  nomContact: string;
  prenomContact: string;
  titreContact: string;
  emailContact: string;
  telephoneContact: string;
  langue: string;
  typeSejour: string;
  categorieHotel: string;
  categorieHotelAutre: string;
  stationDemandee: string;
  nombrePax: string;
  chambresSimple: string;
  chambresDouble: string;
  chambresAutre: string;
  dateOptions: { du: string; au: string }[];
  dateConfirmeeDu: string;
  dateConfirmeeAu: string;
  autres: string;
  transmisPar: string;
  traitePar: string;
  seminaire: boolean;
  seminaireJournee: boolean;
  seminaireDemiJournee: boolean;
  seminaireDetails: string;
  reservationEffectuee: boolean;
  contactEntreDansBrevo: boolean;
  relanceEffectueeLe: string;
};

export const defaultOfferFormValues: OfferFormValues = {
  activiteUniquement: false,
  societeContact: "",
  typeSociete: "",
  pays: "🇨🇭 CH",
  nomContact: "",
  prenomContact: "",
  titreContact: "",
  emailContact: "",
  telephoneContact: "",
  langue: "Français",
  typeSejour: "",
  categorieHotel: "",
  categorieHotelAutre: "",
  stationDemandee: "",
  nombrePax: "",
  chambresSimple: "",
  chambresDouble: "",
  chambresAutre: "",
  dateOptions: [{ du: "", au: "" }],
  dateConfirmeeDu: "",
  dateConfirmeeAu: "",
  autres: "",
  transmisPar: "",
  traitePar: "",
  seminaire: false,
  seminaireJournee: false,
  seminaireDemiJournee: false,
  seminaireDetails: "",
  reservationEffectuee: false,
  contactEntreDansBrevo: false,
  relanceEffectueeLe: "",
};

type StepDef = { key: string; label: string };

const ALL_STEPS: StepDef[] = [
  { key: "societe", label: "Société" },
  { key: "contact", label: "Contact" },
  { key: "sejour", label: "Séjour" },
  { key: "seminaire", label: "Séminaire" },
  { key: "finalisation", label: "Finalisation" },
];

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
  stepper?: boolean;
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
  stepper = false,
}: OfferFormProps) {
  const [formState, setFormState] = useState<OfferFormValues>({
    ...defaultOfferFormValues,
    ...initialValues,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [categorieSuggestions, setCategorieSuggestions] = useState<string[]>([]);
  const formRef = useRef<HTMLFormElement>(null);
  const [activeSection, setActiveSection] = useState("societe");

  const steps = useMemo<StepDef[]>(() => {
    if (formState.activiteUniquement) {
      return ALL_STEPS.filter((s) => s.key !== "sejour" && s.key !== "seminaire");
    }
    return ALL_STEPS;
  }, [formState.activiteUniquement]);

  const activeKey = steps[currentStep]?.key ?? "societe";

  useEffect(() => {
    fetchCategorieHotelAutreSuggestions().then(setCategorieSuggestions).catch(() => {});
  }, []);

  const handleToggleActiviteUniquement = (checked: boolean) => {
    if (checked) {
      const hasSejourData =
        formState.typeSejour ||
        formState.categorieHotel ||
        formState.categorieHotelAutre ||
        formState.stationDemandee ||
        formState.nombrePax ||
        formState.chambresSimple ||
        formState.chambresDouble ||
        formState.chambresAutre ||
        formState.dateOptions.some((o) => o.du || o.au);
      const hasSeminaireData =
        formState.seminaire ||
        formState.seminaireJournee ||
        formState.seminaireDemiJournee ||
        formState.seminaireDetails;

      if (hasSejourData || hasSeminaireData) {
        if (
          !window.confirm(
            "Les informations Séjour et Séminaire remplies seront supprimées. Continuer ?"
          )
        )
          return;
      }

      setFormState((prev) => ({
        ...prev,
        activiteUniquement: true,
        typeSejour: "",
        categorieHotel: "",
        categorieHotelAutre: "",
        stationDemandee: "",
        nombrePax: "",
        chambresSimple: "",
        chambresDouble: "",
        chambresAutre: "",
        dateOptions: [{ du: "", au: "" }],
        seminaire: false,
        seminaireJournee: false,
        seminaireDemiJournee: false,
        seminaireDetails: "",
      }));
      // After toggling on, the visible steps shrink — reset step if out of range
      // New steps: societe(0), contact(1), finalisation(2) → max index 2
      setCurrentStep((prev) => (prev > 2 ? 0 : prev));
    } else {
      setFormState((prev) => ({ ...prev, activiteUniquement: false }));
    }
  };

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
    if (stepper && currentStep < steps.length - 1) {
      handleNext();
      return;
    }
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

  const handleKeyDown = (event: React.KeyboardEvent<HTMLFormElement>) => {
    if (
      stepper &&
      currentStep < steps.length - 1 &&
      event.key === "Enter" &&
      (event.target as HTMLElement).tagName !== "TEXTAREA"
    ) {
      event.preventDefault();
      handleNext();
    }
  };

  const handleNext = () => {
    if (!formRef.current) return;
    const stepEl = formRef.current.querySelector(`[data-step="${activeKey}"]`);
    if (stepEl) {
      const inputs = stepEl.querySelectorAll<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >("input, select, textarea");
      for (const input of inputs) {
        if (!input.checkValidity()) {
          input.reportValidity();
          return;
        }
      }
    }
    setCurrentStep((prev) => prev + 1);
  };

  const handlePrev = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
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
  const categorieChoices = useMemo(() => {
    const selected = formState.categorieHotel
      ? formState.categorieHotel.split(",").filter(Boolean)
      : [];
    const merged = [...options.categorieHotel];
    for (const val of selected) {
      if (!merged.includes(val)) merged.push(val);
    }
    return merged;
  }, [options.categorieHotel, formState.categorieHotel]);

  const handleCategorieToggle = (value: string) => {
    setFormState((prev) => {
      const current = prev.categorieHotel
        ? prev.categorieHotel.split(",").filter(Boolean)
        : [];
      const updated = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      return { ...prev, categorieHotel: updated.join(",") };
    });
  };
  const stationChoices = useMemo(() => {
    const selected = formState.stationDemandee
      ? formState.stationDemandee.split(",").filter(Boolean)
      : [];
    const merged = [...options.stationDemandee];
    for (const val of selected) {
      if (!merged.includes(val)) merged.push(val);
    }
    return merged;
  }, [options.stationDemandee, formState.stationDemandee]);

  const handleStationToggle = (value: string) => {
    setFormState((prev) => {
      const current = prev.stationDemandee
        ? prev.stationDemandee.split(",").filter(Boolean)
        : [];
      const updated = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      return { ...prev, stationDemandee: updated.join(",") };
    });
  };
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

  const stepVisible = (key: string) =>
    stepper ? activeKey === key : activeSection === key;

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      onKeyDown={handleKeyDown}
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

      {stepper && (
        <StepIndicator
          steps={steps}
          currentStep={currentStep}
          onStepClick={setCurrentStep}
        />
      )}

      {!stepper && (
        <div className="mb-6">
          <nav className="inline-flex rounded-lg bg-slate-100 p-1">
            {steps.map((step) => {
              const isActive = activeSection === step.key;
              return (
                <button
                  key={step.key}
                  type="button"
                  onClick={() => setActiveSection(step.key)}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium transition-all ${
                    isActive
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {step.label}
                </button>
              );
            })}
          </nav>
        </div>
      )}

      <div className="space-y-8">
        {/* Step: Société */}
        <div data-step="societe" className={stepVisible("societe") ? "" : "hidden"}>
          <FormSection title="Informations société">
            <label className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800 cursor-pointer">
              <input
                type="checkbox"
                checked={formState.activiteUniquement}
                onChange={(e) => handleToggleActiviteUniquement(e.target.checked)}
                className={checkboxClass}
              />
              Activité uniquement (pas d&apos;hébergement)
            </label>
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
                  <option value="" disabled>Sélectionner…</option>
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
        </div>

        {/* Step: Contact */}
        <div data-step="contact" className={stepVisible("contact") ? "" : "hidden"}>
          <FormSection title="Contact principal" description="Coordonnées directes de votre interlocuteur.">
            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Titre">
                <select
                  name="titreContact"
                  value={formState.titreContact}
                  onChange={handleChange}
                  className={inputClass}
                >
                  <option value="">Non renseigné</option>
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
            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Email du contact">
                <input
                  name="emailContact"
                  type="email"
                  value={formState.emailContact}
                  onChange={handleChange}
                  className={inputClass}
                />
              </Field>

              <Field label="Téléphone du contact">
                <input
                  name="telephoneContact"
                  type="tel"
                  value={formState.telephoneContact}
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
        </div>

        {/* Step: Séjour */}
        {!formState.activiteUniquement && (
        <div data-step="sejour" className={stepVisible("sejour") ? "" : "hidden"}>
          <FormSection title="Séjour" description="Informations sur la demande reçue.">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Type de séjour">
                <select
                  name="typeSejour"
                  value={formState.typeSejour}
                  onChange={handleChange}
                  className={inputClass}
                >
                  <option value="">Non renseigné</option>
                  {typeSejourChoices.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </Field>

            </div>

            <Field label="Station demandée">
              <div className="mt-1 flex flex-wrap gap-3">
                {stationChoices.map((option) => {
                  const selected = formState.stationDemandee
                    .split(",")
                    .filter(Boolean);
                  return (
                    <label
                      key={option}
                      className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
                        selected.includes(option)
                          ? "border-brand-900 bg-brand-900/5 text-brand-900 font-medium"
                          : "border-slate-200 text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selected.includes(option)}
                        onChange={() => handleStationToggle(option)}
                        className="sr-only"
                      />
                      {option}
                    </label>
                  );
                })}
              </div>
            </Field>

            <Field label="Catégorie d'hôtel">
              <div className="mt-1 flex flex-wrap gap-3">
                {categorieChoices.map((option) => {
                  const selected = formState.categorieHotel
                    .split(",")
                    .filter(Boolean);
                  return (
                    <label
                      key={option}
                      className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
                        selected.includes(option)
                          ? "border-brand-900 bg-brand-900/5 text-brand-900 font-medium"
                          : "border-slate-200 text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selected.includes(option)}
                        onChange={() => handleCategorieToggle(option)}
                        className="sr-only"
                      />
                      {formatStars(option)}
                    </label>
                  );
                })}
              </div>
            </Field>

            <Field label="Catégorie d'hôtel — autre (à préciser)">
              <input
                name="categorieHotelAutre"
                value={formState.categorieHotelAutre}
                onChange={handleChange}
                className={inputClass}
                placeholder="Ex : appart-hôtel, chalet, auberge…"
                list="categorieHotelAutre-suggestions"
                autoComplete="off"
              />
              <datalist id="categorieHotelAutre-suggestions">
                {categorieSuggestions.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </Field>

            <div className="grid gap-4 md:grid-cols-3">
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

            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Chambres simple">
                <input
                  name="chambresSimple"
                  value={formState.chambresSimple}
                  onChange={handleChange}
                  className={inputClass}
                  type="number"
                  min={0}
                />
              </Field>
              <Field label="Chambres double">
                <input
                  name="chambresDouble"
                  value={formState.chambresDouble}
                  onChange={handleChange}
                  className={inputClass}
                  type="number"
                  min={0}
                />
              </Field>
              <Field label="Chambres autre">
                <input
                  name="chambresAutre"
                  value={formState.chambresAutre}
                  onChange={handleChange}
                  className={inputClass}
                  type="number"
                  min={0}
                />
              </Field>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium text-slate-700">Options de dates</p>
              {formState.dateOptions.map((opt, i) => (
                <div key={i} className="flex items-end gap-3">
                  <span className="shrink-0 pb-2 text-xs font-semibold text-slate-400">
                    Option {i + 1}
                  </span>
                  <Field label="Du">
                    <input
                      type="date"
                      value={opt.du}
                      onChange={(e) => {
                        const updated = [...formState.dateOptions];
                        updated[i] = { ...updated[i], du: e.target.value };
                        setFormState((prev) => ({ ...prev, dateOptions: updated }));
                      }}
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Au">
                    <input
                      type="date"
                      value={opt.au}
                      onChange={(e) => {
                        const updated = [...formState.dateOptions];
                        updated[i] = { ...updated[i], au: e.target.value };
                        setFormState((prev) => ({ ...prev, dateOptions: updated }));
                      }}
                      className={inputClass}
                    />
                  </Field>
                  {(() => {
                    const n = computeNights(opt.du || null, opt.au || null);
                    return n !== null ? (
                      <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                        {n} nuit{n > 1 ? "s" : ""}
                      </span>
                    ) : null;
                  })()}
                  {formState.dateOptions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        setFormState((prev) => ({
                          ...prev,
                          dateOptions: prev.dateOptions.filter((_, j) => j !== i),
                        }));
                      }}
                      className="shrink-0 rounded-lg border border-slate-200 px-2 py-2 text-sm text-slate-400 transition hover:border-red-300 hover:text-red-500"
                    >
                      Supprimer
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() =>
                  setFormState((prev) => ({
                    ...prev,
                    dateOptions: [...prev.dateOptions, { du: "", au: "" }],
                  }))
                }
                className="rounded-lg border border-dashed border-slate-300 px-3 py-1.5 text-sm text-slate-500 transition hover:border-slate-400 hover:text-slate-700"
              >
                + Ajouter une option
              </button>
            </div>
          </FormSection>
        </div>
        )}

        {/* Step: Séminaire */}
        {!formState.activiteUniquement && (
        <div data-step="seminaire" className={stepVisible("seminaire") ? "" : "hidden"}>
          <FormSection title="Séminaire">
            <Field label="Séminaire">
              <input
                type="checkbox"
                name="seminaire"
                checked={formState.seminaire}
                onChange={(e) => {
                  if (!e.target.checked && (formState.seminaireJournee || formState.seminaireDemiJournee || formState.seminaireDetails)) {
                    if (!window.confirm("Les informations séminaire remplies seront supprimées. Continuer ?")) return;
                    setFormState((prev) => ({
                      ...prev,
                      seminaire: false,
                      seminaireJournee: false,
                      seminaireDemiJournee: false,
                      seminaireDetails: "",
                    }));
                  } else {
                    setFormState((prev) => ({ ...prev, seminaire: e.target.checked }));
                  }
                }}
                className={checkboxClass}
              />
            </Field>

            {formState.seminaire && (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Journée">
                    <input
                      type="checkbox"
                      name="seminaireJournee"
                      checked={formState.seminaireJournee}
                      onChange={handleCheckbox}
                      className={checkboxClass}
                    />
                  </Field>

                  <Field label="Demi-journée">
                    <input
                      type="checkbox"
                      name="seminaireDemiJournee"
                      checked={formState.seminaireDemiJournee}
                      onChange={handleCheckbox}
                      className={checkboxClass}
                    />
                  </Field>
                </div>

                <Field label="Détails">
                  <textarea
                    name="seminaireDetails"
                    value={formState.seminaireDetails}
                    onChange={handleChange}
                    rows={3}
                    className={inputClass}
                  />
                </Field>
              </>
            )}
          </FormSection>
        </div>
        )}

        {/* Step: Finalisation (Suivi + Options + Autres) */}
        <div
          data-step="finalisation"
          className={stepVisible("finalisation") ? "space-y-8" : "hidden"}
        >
          {showFollowUpFields && (
            <>
              <FormSection title="Suivi de l'offre">
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Relance effectuée le">
                    <input
                      type="date"
                      name="relanceEffectueeLe"
                      value={formState.relanceEffectueeLe}
                      onChange={handleChange}
                      className={inputClass}
                    />
                  </Field>
                </div>
              </FormSection>

              <FormSection title="Date confirmée" description="Remplir une fois les dates définitives connues.">
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Date confirmée du">
                    <input
                      type="date"
                      name="dateConfirmeeDu"
                      value={formState.dateConfirmeeDu}
                      onChange={handleChange}
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Date confirmée au">
                    <input
                      type="date"
                      name="dateConfirmeeAu"
                      value={formState.dateConfirmeeAu}
                      onChange={handleChange}
                      className={inputClass}
                    />
                  </Field>
                </div>
              </FormSection>
            </>
          )}

          <FormSection title="Options">
            <div className="grid gap-4 sm:grid-cols-3">
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
      </div>

      {error && (
        <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {stepper ? (
        <StepNavigation
          currentStep={currentStep}
          totalSteps={steps.length}
          onPrev={handlePrev}
          onNext={handleNext}
          onSubmit={() => formRef.current?.requestSubmit()}
          isSubmitting={isSubmitting}
          submitLabel={submitLabel}
        />
      ) : (
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
      )}
    </form>
  );
}

function StepIndicator({
  steps,
  currentStep,
  onStepClick,
}: {
  steps: { key: string; label: string }[];
  currentStep: number;
  onStepClick: (step: number) => void;
}) {
  return (
    <nav className="mb-8 flex items-center">
      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isCurrent = index === currentStep;
        return (
          <div key={step.label} className="flex flex-1 items-center">
            <button
              type="button"
              onClick={() => isCompleted && onStepClick(index)}
              disabled={!isCompleted}
              className={`flex items-center gap-2 ${isCompleted ? "cursor-pointer" : "cursor-default"}`}
            >
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                  isCompleted
                    ? "bg-brand-900 text-white"
                    : isCurrent
                      ? "ring-2 ring-brand-900 text-brand-900 bg-white"
                      : "bg-slate-200 text-slate-400"
                }`}
              >
                {isCompleted ? (
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  index + 1
                )}
              </span>
              <span
                className={`hidden text-sm font-medium sm:inline ${
                  isCurrent
                    ? "text-brand-900"
                    : isCompleted
                      ? "text-slate-900"
                      : "text-slate-400"
                }`}
              >
                {step.label}
              </span>
            </button>
            {index < steps.length - 1 && (
              <div
                className={`mx-3 h-px flex-1 ${
                  index < currentStep ? "bg-brand-900" : "bg-slate-200"
                }`}
              />
            )}
          </div>
        );
      })}
    </nav>
  );
}

function StepNavigation({
  currentStep,
  totalSteps,
  onPrev,
  onNext,
  onSubmit,
  isSubmitting,
  submitLabel,
}: {
  currentStep: number;
  totalSteps: number;
  onPrev: () => void;
  onNext: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  submitLabel: string;
}) {
  const isLast = currentStep === totalSteps - 1;
  return (
    <div className="mt-6 flex items-center justify-between">
      <button
        type="button"
        onClick={onPrev}
        disabled={currentStep === 0}
        className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Précédent
      </button>
      <button
        type="button"
        disabled={isSubmitting}
        onClick={isLast ? onSubmit : onNext}
        className="rounded-lg bg-brand-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLast ? (isSubmitting ? "Enregistrement..." : submitLabel) : "Suivant"}
      </button>
    </div>
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
        <span className="h-9 w-1 rounded-full bg-gradient-to-b from-brand-900 to-brand-500" />
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
    sejourDu: effective.du ? new Date(effective.du).toISOString() : undefined,
    sejourAu: effective.au ? new Date(effective.au).toISOString() : undefined,
    relanceEffectueeLe: values.relanceEffectueeLe
      ? new Date(values.relanceEffectueeLe).toISOString()
      : undefined,
  } satisfies Partial<Offer>;
}

export function mapOfferToFormValues(offer: Offer): OfferFormValues {
  let dateOptions: { du: string; au: string }[] =
    offer.dateOptions?.map((opt) => ({
      du: opt.du ? opt.du.slice(0, 10) : "",
      au: opt.au ? opt.au.slice(0, 10) : "",
    })) ?? [];

  // Legacy fallback: if no dateOptions but sejourDu/Au exist, use them as option 1
  if (dateOptions.length === 0 && (offer.sejourDu || offer.sejourAu)) {
    dateOptions = [
      {
        du: offer.sejourDu ? offer.sejourDu.slice(0, 10) : "",
        au: offer.sejourAu ? offer.sejourAu.slice(0, 10) : "",
      },
    ];
  }

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
    contactEntreDansBrevo: offer.contactEntreDansBrevo ?? false,
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
        className="rounded-lg bg-brand-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting ? "Enregistrement..." : submitLabel}
      </button>
    </div>
  );
}
