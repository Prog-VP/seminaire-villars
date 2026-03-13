"use client";

import { useOfferFormCtx } from "../offer-form-context";
import { formatStars, computeNights } from "../../utils";
import { Field, FormSection } from "../offer-form-sections";

export function SejourSection({
  typeSejourChoices,
  stationChoices,
  categorieChoices,
  handleCategorieToggle,
  traiteParChoices,
  categorieSuggestions,
}: {
  typeSejourChoices: string[];
  stationChoices: string[];
  categorieChoices: string[];
  handleCategorieToggle: (value: string) => void;
  traiteParChoices: string[];
  categorieSuggestions: string[];
}) {
  const { formState, handleChange, setFormState, inputClass } = useOfferFormCtx();

  return (
    <FormSection title="Séjour" description="Informations sur la demande reçue.">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Type de séjour">
          <select name="typeSejour" value={formState.typeSejour} onChange={handleChange} className={inputClass}>
            <option value="">Non renseigné</option>
            {typeSejourChoices.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </Field>
      </div>

      <Field label="Station demandée">
        <div className="mt-1 flex flex-wrap gap-3">
          {stationChoices.map((option) => {
            const selected = formState.stationDemandee.split(",").filter(Boolean).map((s) => s.trim());
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
                  onChange={() => {
                    const next = selected.includes(option)
                      ? selected.filter((s) => s !== option)
                      : [...selected, option];
                    setFormState((prev) => ({ ...prev, stationDemandee: next.join(",") }));
                  }}
                  className="sr-only"
                />
                {option}
              </label>
            );
          })}
        </div>
      </Field>

      {!formState.activiteUniquement && (
        <>
          <Field label="Catégorie d'hôtel">
            <div className="mt-1 flex flex-wrap gap-3">
              {categorieChoices.map((option) => {
                const selected = formState.categorieHotel.split(",").filter(Boolean);
                return (
                  <label
                    key={option}
                    className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
                      selected.includes(option)
                        ? "border-brand-900 bg-brand-900/5 text-brand-900 font-medium"
                        : "border-slate-200 text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    <input type="checkbox" checked={selected.includes(option)} onChange={() => handleCategorieToggle(option)} className="sr-only" />
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
              {categorieSuggestions.map((s) => <option key={s} value={s} />)}
            </datalist>
          </Field>

          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Nombre de participants">
              <input name="nombrePax" value={formState.nombrePax} onChange={handleChange} className={inputClass} type="number" min={0} />
            </Field>
            <Field label="Traité par">
              <select name="traitePar" value={formState.traitePar} onChange={handleChange} className={inputClass}>
                <option value="">Non défini</option>
                {traiteParChoices.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </Field>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Chambres simple">
              <input name="chambresSimple" value={formState.chambresSimple} onChange={handleChange} className={inputClass} type="number" min={0} />
            </Field>
            <Field label="Chambres double">
              <input name="chambresDouble" value={formState.chambresDouble} onChange={handleChange} className={inputClass} type="number" min={0} />
            </Field>
            <Field label="Chambres autre">
              <input name="chambresAutre" value={formState.chambresAutre} onChange={handleChange} className={inputClass} type="number" min={0} />
            </Field>
          </div>
        </>
      )}

      <div className="space-y-3">
        <p className="text-sm font-medium text-slate-700">Options de dates</p>
        {formState.dateOptions.map((opt, i) => (
          <div key={i} className="flex items-end gap-3">
            <span className="shrink-0 pb-2 text-xs font-semibold text-slate-400">Option {i + 1}</span>
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
                onClick={() => setFormState((prev) => ({ ...prev, dateOptions: prev.dateOptions.filter((_, j) => j !== i) }))}
                className="shrink-0 rounded-lg border border-slate-200 px-2 py-2 text-sm text-slate-400 transition hover:border-red-300 hover:text-red-500"
              >
                Supprimer
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={() => setFormState((prev) => ({ ...prev, dateOptions: [...prev.dateOptions, { du: "", au: "" }] }))}
          className="rounded-lg border border-dashed border-slate-300 px-3 py-1.5 text-sm text-slate-500 transition hover:border-slate-400 hover:text-slate-700"
        >
          + Ajouter une option
        </button>
      </div>
    </FormSection>
  );
}
