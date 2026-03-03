"use client";

import { useMemo, useState } from "react";
import type { OfferFiltersState } from "./OfferTable";
import { useSettings } from "@/features/settings/context";
import { formatStars, OFFER_STATUTS } from "../utils";

const boolOptions = [
  { value: "all", label: "Tous" },
  { value: "true", label: "Oui" },
  { value: "false", label: "Non" },
];

export function OfferFilters({
  filters,
  onChange,
  onReset,
}: {
  filters: OfferFiltersState;
  onChange: (next: Partial<OfferFiltersState>) => void;
  onReset: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const { options } = useSettings();
  const inputClass =
    "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500";

  const paysChoices = useMemo(
    () => mergeFilterOption(options.pays, filters.pays),
    [options.pays, filters.pays]
  );
  const traiteParChoices = useMemo(
    () => mergeFilterOption(options.traitePar, filters.traitePar),
    [options.traitePar, filters.traitePar]
  );
  const typeSocieteChoices = useMemo(
    () => mergeFilterOption(options.typeSociete, filters.typeSociete),
    [options.typeSociete, filters.typeSociete]
  );
  const typeSejourChoices = useMemo(
    () => mergeFilterOption(options.typeSejour, filters.typeSejour),
    [options.typeSejour, filters.typeSejour]
  );
  const categorieChoices = useMemo(
    () => mergeFilterOption(options.categorieHotel, filters.categorieHotel),
    [options.categorieHotel, filters.categorieHotel]
  );
  const stationChoices = useMemo(
    () => mergeFilterOption(options.stationDemandee, filters.stationDemandee),
    [options.stationDemandee, filters.stationDemandee]
  );

  const handleChange = (
    event:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLSelectElement>
      | React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;
    onChange({ [name]: value });
  };

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Filtres
          </p>
          <h3 className="text-lg font-semibold text-slate-900">
            Affiner les offres
          </h3>
        </div>
        <div className="ml-auto flex gap-2 text-sm">
          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            className="rounded-lg border border-slate-200 px-3 py-1.5 font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
          >
            {isOpen ? "Masquer" : "Afficher"} les filtres
          </button>
          <button
            type="button"
            onClick={onReset}
            className="rounded-lg px-3 py-1.5 font-medium text-slate-500 transition hover:text-slate-900"
          >
            Réinitialiser
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <FilterField label="Société">
            <input
              name="societe"
              value={filters.societe}
              onChange={handleChange}
              className={inputClass}
            />
          </FilterField>

          <FilterField label="Contact">
            <input
              name="contact"
              value={filters.contact}
              onChange={handleChange}
              className={inputClass}
            />
          </FilterField>

          <FilterField label="Email">
            <input
              name="email"
              type="email"
              value={filters.email}
              onChange={handleChange}
              className={inputClass}
            />
          </FilterField>

          <FilterField label="Statut">
            <select
              name="statut"
              value={filters.statut}
              onChange={handleChange}
              className={inputClass}
            >
              <option value="all">Tous</option>
              {OFFER_STATUTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </FilterField>

          <FilterField label="Type de société">
            <select
              name="typeSociete"
              value={filters.typeSociete}
              onChange={handleChange}
              className={inputClass}
            >
              <option value="all">Tous</option>
              {typeSocieteChoices.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </FilterField>

          <FilterField label="Pays">
            <select
              name="pays"
              value={filters.pays}
              onChange={handleChange}
              className={inputClass}
            >
              <option value="all">Tous</option>
              {paysChoices.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </FilterField>

          <FilterField label="Type de séjour">
            <select
              name="typeSejour"
              value={filters.typeSejour}
              onChange={handleChange}
              className={inputClass}
            >
              <option value="all">Tous</option>
              {typeSejourChoices.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </FilterField>

          <FilterField label="Station">
            <select
              name="stationDemandee"
              value={filters.stationDemandee}
              onChange={handleChange}
              className={inputClass}
            >
              <option value="all">Toutes</option>
              {stationChoices.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </FilterField>

          <FilterField label="Catégorie hôtel">
            <select
              name="categorieHotel"
              value={filters.categorieHotel}
              onChange={handleChange}
              className={inputClass}
            >
              <option value="all">Toutes</option>
              {categorieChoices.map((option) => (
                <option key={option} value={option}>
                  {formatStars(option)}
                </option>
              ))}
            </select>
          </FilterField>

          <FilterField label="Traité par">
            <select
              name="traitePar"
              value={filters.traitePar}
              onChange={handleChange}
              className={inputClass}
            >
              <option value="all">Tous</option>
              {traiteParChoices.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </FilterField>

          <FilterField label="Transmis par">
            <input
              name="transmisPar"
              value={filters.transmisPar}
              onChange={handleChange}
              className={inputClass}
            />
          </FilterField>

          <FilterField label="Nombre de participants (min)">
            <input
              name="paxMin"
              type="number"
              min={0}
              value={filters.paxMin}
              onChange={handleChange}
              className={inputClass}
            />
          </FilterField>

          <FilterField label="Nombre de participants (max)">
            <input
              name="paxMax"
              type="number"
              min={0}
              value={filters.paxMax}
              onChange={handleChange}
              className={inputClass}
            />
          </FilterField>

          <FilterField label="Réservation effectuée">
            <select
              name="reservationEffectuee"
              value={filters.reservationEffectuee}
              onChange={handleChange}
              className={inputClass}
            >
              {boolOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </FilterField>

          <FilterField label="Contact saisi dans Brevo">
            <select
              name="contactEntreDansBrevo"
              value={filters.contactEntreDansBrevo}
              onChange={handleChange}
              className={inputClass}
            >
              {boolOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </FilterField>

          <FilterField label="Notes (autres)">
            <textarea
              name="autres"
              value={filters.autres}
              onChange={handleChange}
              rows={2}
              className={inputClass}
            />
          </FilterField>
        </div>
      )}
    </section>
  );
}

function FilterField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
      {label}
      {children}
    </label>
  );
}

function mergeFilterOption(
  options: string[],
  currentValue: string | "all" | null | undefined
) {
  if (!currentValue || currentValue === "all") {
    return options;
  }
  return options.includes(currentValue)
    ? options
    : [...options, currentValue];
}
