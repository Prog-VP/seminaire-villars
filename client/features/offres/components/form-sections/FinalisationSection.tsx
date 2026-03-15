"use client";

import { useOfferFormCtx } from "../offer-form-context";
import { DEFAULT_STATUTS } from "../../utils";
import { useSettings } from "@/features/settings/context";
import { Field, FormSection } from "../offer-form-sections";

export function FinalisationSection({ showFollowUpFields }: { showFollowUpFields: boolean }) {
  const { formState, handleChange, handleCheckbox, inputClass, checkboxClass } = useOfferFormCtx();
  const { options } = useSettings();
  const statutChoices = options.statut.length > 0 ? options.statut : DEFAULT_STATUTS;

  return (
    <>
      {showFollowUpFields && (
        <>
          <FormSection title="Suivi de l'offre">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Statut">
                <select name="statut" value={formState.statut} onChange={handleChange} className={inputClass}>
                  {statutChoices.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
              <Field label="Date d'envoi de l'offre">
                <input type="date" name="dateEnvoiOffre" value={formState.dateEnvoiOffre} onChange={handleChange} className={inputClass} />
              </Field>
              <Field label="Relance effectuée le">
                <input type="date" name="relanceEffectueeLe" value={formState.relanceEffectueeLe} onChange={handleChange} className={inputClass} />
              </Field>
            </div>
          </FormSection>
          <FormSection title="Date confirmée" description="Remplir une fois les dates définitives connues.">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Date confirmée du">
                <input type="date" name="dateConfirmeeDu" value={formState.dateConfirmeeDu} onChange={handleChange} className={inputClass} />
              </Field>
              <Field label="Date confirmée au">
                <input type="date" name="dateConfirmeeAu" value={formState.dateConfirmeeAu} onChange={handleChange} className={inputClass} />
              </Field>
            </div>
          </FormSection>
        </>
      )}
      <FormSection title="Options">
        <div className="grid gap-4 sm:grid-cols-3">
          {showFollowUpFields && (
            <>
              <Field label="Réservation effectuée">
                <input type="checkbox" name="reservationEffectuee" checked={formState.reservationEffectuee} onChange={handleCheckbox} className={checkboxClass} />
              </Field>
              <Field label="Retour effectué aux hôtels">
                <input type="checkbox" name="retourEffectueHotels" checked={formState.retourEffectueHotels} onChange={handleCheckbox} className={checkboxClass} />
              </Field>
            </>
          )}
          <Field label="Contact saisi dans Brevo">
            <input type="checkbox" name="contactEntreDansBrevo" checked={formState.contactEntreDansBrevo} onChange={handleCheckbox} className={checkboxClass} />
          </Field>
        </div>
      </FormSection>
    </>
  );
}
