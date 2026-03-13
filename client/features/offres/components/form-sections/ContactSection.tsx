"use client";

import { useOfferFormCtx } from "../offer-form-context";
import { Field, FormSection } from "../offer-form-sections";

export function ContactSection({
  titreChoices,
  transmisParChoices,
}: {
  titreChoices: string[];
  transmisParChoices: string[];
}) {
  const { formState, handleChange, inputClass } = useOfferFormCtx();

  return (
    <FormSection title="Contact principal" description="Coordonnées directes de votre interlocuteur.">
      <div className="grid gap-4 md:grid-cols-3">
        <Field label="Titre">
          <select name="titreContact" value={formState.titreContact} onChange={handleChange} className={inputClass}>
            <option value="">Non renseigné</option>
            {titreChoices.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </Field>
        <Field label="Prénom du contact" required>
          <input name="prenomContact" value={formState.prenomContact} onChange={handleChange} className={inputClass} required />
        </Field>
        <Field label="Nom du contact" required>
          <input name="nomContact" value={formState.nomContact} onChange={handleChange} className={inputClass} required />
        </Field>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Field label="Email du contact">
          <input name="emailContact" type="email" value={formState.emailContact} onChange={handleChange} className={inputClass} />
        </Field>
        <Field label="Téléphone du contact">
          <input name="telephoneContact" type="tel" value={formState.telephoneContact} onChange={handleChange} className={inputClass} />
        </Field>
        <Field label="Transmis par">
          <select name="transmisPar" value={formState.transmisPar} onChange={handleChange} className={inputClass}>
            <option value="">Non renseigné</option>
            {transmisParChoices.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </Field>
      </div>
    </FormSection>
  );
}
