"use client";

import { useOfferFormCtx } from "../offer-form-context";
import { Field, FormSection } from "../offer-form-sections";

export function SocieteSection({
  handleToggleActiviteUniquement,
  paysChoices,
  typeSocieteChoices,
  langueChoices,
}: {
  handleToggleActiviteUniquement: (checked: boolean) => void;
  paysChoices: string[];
  typeSocieteChoices: string[];
  langueChoices: string[];
}) {
  const { formState, handleChange, handleCheckbox, inputClass, checkboxClass } = useOfferFormCtx();

  return (
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
      <label className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-800 cursor-pointer">
        <input
          type="checkbox"
          name="activitesDemandees"
          checked={formState.activitesDemandees}
          onChange={handleCheckbox}
          className={checkboxClass}
        />
        Activités demandées
      </label>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Société de contact" required>
          <input name="societeContact" value={formState.societeContact} onChange={handleChange} className={inputClass} required />
        </Field>
        <Field label="Type de société">
          <select name="typeSociete" value={formState.typeSociete} onChange={handleChange} className={inputClass}>
            <option value="" disabled>Sélectionner…</option>
            {typeSocieteChoices.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </Field>
        <Field label="Pays" required>
          <select name="pays" value={formState.pays} onChange={handleChange} className={inputClass} required>
            {paysChoices.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </Field>
        <Field label="Langue">
          <select name="langue" value={formState.langue} onChange={handleChange} className={inputClass}>
            {langueChoices.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </Field>
      </div>
      {formState.activiteUniquement && (
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Nombre de participants">
            <input name="nombrePax" value={formState.nombrePax} onChange={handleChange} className={inputClass} type="number" min={0} />
          </Field>
        </div>
      )}
    </FormSection>
  );
}
