"use client";

import { useOfferFormCtx } from "../offer-form-context";
import { Field, FormSection } from "../offer-form-sections";

export function SeminaireSection() {
  const { formState, handleChange, handleCheckbox, setFormState, inputClass, checkboxClass } = useOfferFormCtx();

  return (
    <FormSection title="Séminaire">
      <Field label="Séminaire">
        <input
          type="checkbox"
          name="seminaire"
          checked={formState.seminaire}
          onChange={(e) => {
            if (!e.target.checked && (formState.seminaireJournee || formState.seminaireDemiJournee || formState.seminaireDetails)) {
              if (!window.confirm("Les informations séminaire remplies seront supprimées. Continuer ?")) return;
              setFormState((prev) => ({ ...prev, seminaire: false, seminaireJournee: false, seminaireDemiJournee: false, seminaireDetails: "" }));
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
              <input type="checkbox" name="seminaireJournee" checked={formState.seminaireJournee} onChange={handleCheckbox} className={checkboxClass} />
            </Field>
            <Field label="Demi-journée">
              <input type="checkbox" name="seminaireDemiJournee" checked={formState.seminaireDemiJournee} onChange={handleCheckbox} className={checkboxClass} />
            </Field>
          </div>
          <Field label="Détails">
            <textarea name="seminaireDetails" value={formState.seminaireDetails} onChange={handleChange} rows={3} className={inputClass} />
          </Field>
        </>
      )}
    </FormSection>
  );
}
