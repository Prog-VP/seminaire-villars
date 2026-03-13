"use client";

import { useMemo, useState } from "react";
import type { OfferFiltersState } from "../hooks/useOfferFiltering";
import { useSettings } from "@/features/settings/context";
import { useUserRole } from "@/features/users/context";
import { formatStars } from "../utils";

const boolOptions = [
  { value: "all", label: "Tous" },
  { value: "true", label: "Oui" },
  { value: "false", label: "Non" },
];

type FilterDef = {
  key: string;
  label: string;
  type: "text" | "select" | "number" | "textarea" | "bool" | "date";
  options?: string[];
  formatOption?: (v: string) => string;
  placeholder?: string;
};

type FilterGroup = {
  title: string;
  filters: FilterDef[];
};

export function OfferFilters({
  filters,
  onChange,
  onReset,
  hotelContacteOptions = [],
  hotelReponduOptions = [],
  anneeOptions = [],
}: {
  filters: OfferFiltersState;
  onChange: (next: Partial<OfferFiltersState>) => void;
  onReset: () => void;
  hotelContacteOptions?: string[];
  hotelReponduOptions?: string[];
  anneeOptions?: string[];
}) {
  const [showAll, setShowAll] = useState(false);
  const { options } = useSettings();
  const { favoriteFilters, toggleFavoriteFilter } = useUserRole();

  const inputClass =
    "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500";

  const filterChoices = useMemo(
    () => ({
      langue: mergeFilterOption(options.langue, filters.langue),
      pays: mergeFilterOption(options.pays, filters.pays),
      traitePar: mergeFilterOption(options.traitePar, filters.traitePar),
      typeSociete: mergeFilterOption(options.typeSociete, filters.typeSociete),
      typeSejour: mergeFilterOption(options.typeSejour, filters.typeSejour),
      categorieHotel: mergeFilterOption(options.categorieHotel, filters.categorieHotel),
      stationDemandee: mergeFilterOption(options.stationDemandee, filters.stationDemandee),
      statut: mergeFilterOption(options.statut, filters.statut),
    }),
    [options, filters.langue, filters.pays, filters.traitePar, filters.typeSociete, filters.typeSejour, filters.categorieHotel, filters.stationDemandee, filters.statut]
  );

  const filterGroups: FilterGroup[] = useMemo(() => [
    {
      title: "Recherche",
      filters: [
        { key: "numeroOffre", label: "N° offre", type: "text" },
        { key: "societe", label: "Société", type: "text" },
        { key: "contact", label: "Contact", type: "text" },
        { key: "email", label: "Email", type: "text" },
        { key: "transmisPar", label: "Transmis par", type: "text" },
        { key: "notes", label: "Notes / Commentaires", type: "textarea" },
      ],
    },
    {
      title: "Classification",
      filters: [
        { key: "anneeOffre", label: "Année offre", type: "select", options: anneeOptions },
        { key: "statut", label: "Statut", type: "select", options: filterChoices.statut },
        { key: "typeSociete", label: "Type de société", type: "select", options: filterChoices.typeSociete },
        { key: "typeSejour", label: "Type de séjour", type: "select", options: filterChoices.typeSejour },
        { key: "langue", label: "Langue", type: "select", options: filterChoices.langue },
        { key: "traitePar", label: "Traité par", type: "select", options: filterChoices.traitePar },
      ],
    },
    {
      title: "Séjour",
      filters: [
        { key: "pays", label: "Pays", type: "select", options: filterChoices.pays },
        { key: "stationDemandee", label: "Destination", type: "select", options: filterChoices.stationDemandee },
        { key: "categorieHotel", label: "Catégorie hôtel", type: "select", options: filterChoices.categorieHotel, formatOption: formatStars },
        { key: "paxMin", label: "Participants (min)", type: "number" },
        { key: "paxMax", label: "Participants (max)", type: "number" },
        { key: "sejourDu", label: "Séjour du", type: "date" },
        { key: "sejourAu", label: "Séjour au", type: "date" },
        { key: "dateEnvoiDu", label: "Date d'envoi du", type: "date" },
        { key: "dateEnvoiAu", label: "Date d'envoi au", type: "date" },
        { key: "relanceDu", label: "Relance du", type: "date" },
        { key: "relanceAu", label: "Relance au", type: "date" },
      ],
    },
    {
      title: "Hôtels",
      filters: [
        { key: "hotelContacte", label: "Hôtel contacté", type: "select", options: hotelContacteOptions },
        { key: "hotelRepondu", label: "Hôtel ayant répondu", type: "select", options: hotelReponduOptions },
      ],
    },
    {
      title: "Options",
      filters: [
        { key: "activiteUniquement", label: "Activité uniquement", type: "bool" },
        { key: "seminaire", label: "Séminaire", type: "bool" },
        { key: "reservationEffectuee", label: "Réservation effectuée", type: "bool" },
        { key: "retourEffectueHotels", label: "Retour effectué aux hôtels", type: "bool" },
        { key: "contactEntreDansBrevo", label: "Contact dans Brevo", type: "bool" },
      ],
    },
  ], [filterChoices, hotelContacteOptions, hotelReponduOptions]);

  const allFilters = filterGroups.flatMap((g) => g.filters);
  const favoriteFilterDefs = allFilters.filter((f) => favoriteFilters.includes(f.key));

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
            onClick={() => setShowAll((prev) => !prev)}
            className="rounded-lg border border-slate-200 px-3 py-1.5 font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
          >
            {showAll ? "Masquer" : "Tous les filtres"}
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

      {/* Favorite filters — always visible */}
      {favoriteFilterDefs.length > 0 && (
        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {favoriteFilterDefs.map((def) => (
            <FilterFieldWithStar
              key={def.key}
              def={def}
              value={(filters as Record<string, string>)[def.key] ?? ""}
              onChange={handleChange}
              inputClass={inputClass}
              isFavorite={true}
              onToggleFavorite={() => toggleFavoriteFilter(def.key)}
            />
          ))}
        </div>
      )}

      {/* All filters — grouped by category */}
      {showAll && (
        <div className={`${favoriteFilterDefs.length > 0 ? "mt-4 border-t border-slate-100 pt-4" : "mt-6"} space-y-5`}>
          {filterGroups.map((group) => {
            const defs = group.filters.filter((f) => !favoriteFilters.includes(f.key));
            if (defs.length === 0) return null;
            return (
              <div key={group.title}>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  {group.title}
                </p>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {defs.map((def) => (
                    <FilterFieldWithStar
                      key={def.key}
                      def={def}
                      value={(filters as Record<string, string>)[def.key] ?? ""}
                      onChange={handleChange}
                      inputClass={inputClass}
                      isFavorite={false}
                      onToggleFavorite={() => toggleFavoriteFilter(def.key)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function FilterFieldWithStar({
  def,
  value,
  onChange,
  inputClass,
  isFavorite,
  onToggleFavorite,
}: {
  def: FilterDef;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLSelectElement> | React.ChangeEvent<HTMLTextAreaElement>) => void;
  inputClass: string;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}) {
  const allValue = def.key === "hotelContacte" || def.key === "hotelRepondu" ? "" : "all";
  const allLabel = def.key === "stationDemandee" || def.key === "categorieHotel" ? "Toutes" : "Tous";

  return (
    <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
      <span className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            onToggleFavorite();
          }}
          className={`transition ${isFavorite ? "text-amber-400 hover:text-amber-500" : "text-slate-300 hover:text-amber-400"}`}
          title={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
            <path
              fillRule="evenodd"
              d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z"
              clipRule="evenodd"
            />
          </svg>
        </button>
        {def.label}
      </span>
      {def.type === "text" && (
        <input name={def.key} value={value} onChange={onChange} className={inputClass} />
      )}
      {def.type === "number" && (
        <input name={def.key} type="number" min={0} value={value} onChange={onChange} className={inputClass} />
      )}
      {def.type === "textarea" && (
        <textarea name={def.key} value={value} onChange={onChange} rows={2} className={inputClass} />
      )}
      {def.type === "select" && (
        <select name={def.key} value={value} onChange={onChange} className={inputClass}>
          <option value={allValue}>{allLabel}</option>
          {(def.options ?? []).map((opt) => (
            <option key={opt} value={opt}>
              {def.formatOption ? def.formatOption(opt) : opt}
            </option>
          ))}
        </select>
      )}
      {def.type === "date" && (
        <input name={def.key} type="date" value={value} onChange={onChange} className={inputClass} />
      )}
      {def.type === "bool" && (
        <select name={def.key} value={value} onChange={onChange} className={inputClass}>
          {boolOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )}
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
