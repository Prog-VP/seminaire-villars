"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { fetchCategorieHotelAutreSuggestions } from "../api";
import { useFormChoices } from "../hooks/useFormChoices";
import type { OfferFormValues, StepDef, OfferFormProps } from "./offer-form-types";
import { defaultOfferFormValues, ALL_STEPS } from "./offer-form-types";
import { mapFormValuesToPayload, mapOfferToFormValues } from "./offer-form-mappers";
import { OfferFormProvider } from "./offer-form-context";
import {
  SocieteSection,
  ContactSection,
  SejourSection,
  SeminaireSection,
  FinalisationSection,
} from "./offer-form-sections";
import { StepIndicator, StepNavigation, ActionButtons } from "./offer-form-nav";

export { defaultOfferFormValues, mapFormValuesToPayload, mapOfferToFormValues };
export type { OfferFormValues, OfferFormProps };

const INPUT_CLASS = "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500";
const CHECKBOX_CLASS = "h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-200";

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
  const [formState, setFormState] = useState<OfferFormValues>({ ...defaultOfferFormValues, ...initialValues });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [categorieSuggestions, setCategorieSuggestions] = useState<string[]>([]);
  const formRef = useRef<HTMLFormElement>(null);
  const [activeSection, setActiveSection] = useState("societe");
  const [tabErrors, setTabErrors] = useState<Set<string>>(new Set());

  const choices = useFormChoices(formState);

  const steps = useMemo<StepDef[]>(() => {
    if (formState.activiteUniquement) return ALL_STEPS.filter((s) => s.key !== "seminaire");
    return ALL_STEPS;
  }, [formState.activiteUniquement]);

  const activeKey = steps[currentStep]?.key ?? "societe";

  useEffect(() => {
    fetchCategorieHotelAutreSuggestions().then(setCategorieSuggestions).catch(() => {});
  }, []);

  // Warn on page leave with unsaved changes
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setIsDirty(true);
    setFormState((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleCheckbox = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsDirty(true);
    setFormState((prev) => ({ ...prev, [e.target.name]: e.target.checked }));
  };

  const handleCategorieToggle = (value: string) => {
    setIsDirty(true);
    setFormState((prev) => {
      const current = prev.categorieHotel ? prev.categorieHotel.split(",").filter(Boolean) : [];
      const updated = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
      return { ...prev, categorieHotel: updated.join(",") };
    });
  };

  const handleToggleActiviteUniquement = (checked: boolean) => {
    if (checked) {
      const hasData =
        formState.typeSejour || formState.categorieHotel || formState.categorieHotelAutre ||
        formState.stationDemandee || formState.chambresSimple ||
        formState.chambresDouble || formState.chambresAutre || formState.dateOptions.some((o) => o.du || o.au) ||
        formState.seminaireJournee || formState.seminaireDemiJournee || formState.seminaireDetails;

      if (hasData && !window.confirm("Les informations Séjour et Séminaire remplies seront supprimées. Continuer ?")) return;

      setFormState((prev) => ({
        ...prev, activiteUniquement: true, activitesDemandees: true,
        typeSejour: "", categorieHotel: "", categorieHotelAutre: "", stationDemandee: "",
        chambresSimple: "", chambresDouble: "", chambresAutre: "",
        dateOptions: [{ du: "", au: "" }],
        seminaireJournee: false, seminaireDemiJournee: false, seminaireDetails: "",
      }));
      setCurrentStep((prev) => (prev > 2 ? 0 : prev));
    } else {
      setFormState((prev) => ({ ...prev, activiteUniquement: false }));
    }
  };

  const validateAllTabs = (): string | null => {
    if (!formRef.current) return null;
    const errors = new Set<string>();
    let firstErrorTab: string | null = null;

    for (const step of steps) {
      const stepEl = formRef.current.querySelector(`[data-step="${step.key}"]`);
      if (!stepEl) continue;
      const inputs = stepEl.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>("input, select, textarea");
      for (const input of inputs) {
        if (input.required && !input.value.trim()) {
          errors.add(step.key);
          if (!firstErrorTab) firstErrorTab = step.key;
          break;
        }
        if (input.value && input instanceof HTMLInputElement && input.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value)) {
          errors.add(step.key);
          if (!firstErrorTab) firstErrorTab = step.key;
          break;
        }
      }
    }
    setTabErrors(errors);
    return firstErrorTab;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (stepper && currentStep < steps.length - 1) { handleNext(); return; }

    if (!stepper) {
      const firstErrorTab = validateAllTabs();
      if (firstErrorTab) {
        setActiveSection(firstErrorTab);
        requestAnimationFrame(() => {
          const stepEl = formRef.current?.querySelector(`[data-step="${firstErrorTab}"]`);
          if (!stepEl) return;
          for (const input of stepEl.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>("input, select, textarea")) {
            if (!input.checkValidity()) { input.reportValidity(); break; }
          }
        });
        return;
      }
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit(formState);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLFormElement>) => {
    if (stepper && currentStep < steps.length - 1 && event.key === "Enter" && (event.target as HTMLElement).tagName !== "TEXTAREA") {
      event.preventDefault();
      handleNext();
    }
  };

  const handleNext = () => {
    if (!formRef.current) return;
    const stepEl = formRef.current.querySelector(`[data-step="${activeKey}"]`);
    if (stepEl) {
      for (const input of stepEl.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>("input, select, textarea")) {
        if (!input.checkValidity()) { input.reportValidity(); return; }
      }
    }
    setCurrentStep((prev) => prev + 1);
  };

  const handleCancel = () => {
    if (isDirty && !window.confirm("Vous avez des modifications non enregistrées. Quitter sans sauvegarder ?")) return;
    onCancel?.();
  };

  const stepVisible = (key: string) => (stepper ? activeKey === key : activeSection === key);

  const ctxValue = useMemo(() => ({
    formState, setFormState, handleChange, handleCheckbox,
    inputClass: INPUT_CLASS, checkboxClass: CHECKBOX_CLASS,
  }), [formState]);

  return (
    <OfferFormProvider value={ctxValue}>
      <form ref={formRef} onSubmit={handleSubmit} onKeyDown={handleKeyDown} noValidate={!stepper} className="rounded-xl border border-slate-200 bg-white p-3 sm:p-6 shadow-sm">
        {(heading || subheading) && (
          <header className="mb-6">
            {heading && <h2 className="text-2xl font-semibold text-slate-900">{heading}</h2>}
            {subheading && <p className="text-sm text-slate-600">{subheading}</p>}
          </header>
        )}

        {stepper && <StepIndicator steps={steps} currentStep={currentStep} onStepClick={setCurrentStep} />}

        {!stepper && (
          <div className="mb-6 -mx-3 sm:mx-0 overflow-x-auto">
            <nav className="inline-flex min-w-max rounded-lg bg-slate-100 p-1">
              {steps.map((step) => {
                const isActive = activeSection === step.key;
                const hasError = tabErrors.has(step.key);
                return (
                  <button
                    key={step.key}
                    type="button"
                    onClick={() => {
                      setActiveSection(step.key);
                      setTabErrors((prev) => { const next = new Set(prev); next.delete(step.key); return next; });
                    }}
                    className={`relative rounded-md px-2.5 py-1.5 text-xs sm:text-sm sm:px-3 font-medium transition-all whitespace-nowrap ${
                      isActive ? "bg-white text-slate-900 shadow-sm" : hasError ? "text-red-600 hover:text-red-700" : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    {step.label}
                    {hasError && <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-red-500" />}
                  </button>
                );
              })}
            </nav>
          </div>
        )}

        <div className="space-y-8">
          <div data-step="societe" className={stepVisible("societe") ? "" : "hidden"}>
            <SocieteSection
              handleToggleActiviteUniquement={handleToggleActiviteUniquement}
              paysChoices={choices.pays}
              typeSocieteChoices={choices.typeSociete}
              langueChoices={choices.langue}
            />
          </div>

          <div data-step="contact" className={stepVisible("contact") ? "" : "hidden"}>
            <ContactSection titreChoices={choices.titre} transmisParChoices={choices.transmisPar} />
          </div>

          <div data-step="sejour" className={stepVisible("sejour") ? "" : "hidden"}>
            <SejourSection
              typeSejourChoices={choices.typeSejour}
              stationChoices={choices.station}
              categorieChoices={choices.categorie}
              handleCategorieToggle={handleCategorieToggle}
              traiteParChoices={choices.traitePar}
              categorieSuggestions={categorieSuggestions}
            />
          </div>

          {!formState.activiteUniquement && (
            <div data-step="seminaire" className={stepVisible("seminaire") ? "" : "hidden"}>
              <SeminaireSection />
            </div>
          )}

          <div data-step="finalisation" className={stepVisible("finalisation") ? "space-y-8" : "hidden"}>
            <FinalisationSection showFollowUpFields={showFollowUpFields} />
          </div>
        </div>

        {error && <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

        {stepper ? (
          <StepNavigation
            currentStep={currentStep}
            totalSteps={steps.length}
            onPrev={() => setCurrentStep((prev) => Math.max(prev - 1, 0))}
            onNext={handleNext}
            onSubmit={() => formRef.current?.requestSubmit()}
            isSubmitting={isSubmitting}
            submitLabel={submitLabel}
          />
        ) : (
          <ActionButtons
            onCancel={onCancel ? handleCancel : undefined}
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
    </OfferFormProvider>
  );
}
