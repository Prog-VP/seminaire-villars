"use client";

import { useOfferFormCtx } from "../offer-form-context";
import { Field, FormSection } from "../offer-form-sections";

export function SeminaireSection() {
  const { formState, handleChange, handleCheckbox, inputClass, checkboxClass } = useOfferFormCtx();

  return (
    <FormSection title="Séminaire">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Journée">
          <input type="checkbox" name="seminaireJournee" checked={formState.seminaireJournee} onChange={handleCheckbox} className={checkboxClass} />
        </Field>
        <Field label="Demi-journée">
          <input type="checkbox" name="seminaireDemiJournee" checked={formState.seminaireDemiJournee} onChange={handleCheckbox} className={checkboxClass} />
        </Field>
      </div>
      {(formState.seminaireJournee || formState.seminaireDemiJournee) && (
        <Field label="Détails">
          <textarea name="seminaireDetails" value={formState.seminaireDetails} onChange={handleChange} rows={3} className={inputClass} />
        </Field>
      )}
    </FormSection>
  );
}
