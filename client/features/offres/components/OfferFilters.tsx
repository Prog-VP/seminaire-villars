"use client";

import { useMemo, useState } from "react";
import type { OfferFiltersState } from "../hooks/useOfferFiltering";
import { useSettings } from "@/features/settings/context";
import { useUserRole } from "@/features/users/context";
import { formatStars } from "../utils";
import { FilterFieldWithStar, mergeFilterOption, type FilterGroup } from "./FilterFieldWithStar";

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
        { key: "anneeOffre", label: "Année offre", type: "multiselect", options: anneeOptions },
        { key: "statut", label: "Statut", type: "multiselect", options: filterChoices.statut },
        { key: "typeSociete", label: "Type de société", type: "multiselect", options: filterChoices.typeSociete },
        { key: "typeSejour", label: "Type de séjour", type: "multiselect", options: filterChoices.typeSejour },
        { key: "langue", label: "Langue", type: "multiselect", options: filterChoices.langue },
        { key: "traitePar", label: "Traité par", type: "multiselect", options: filterChoices.traitePar },
      ],
    },
    {
      title: "Séjour",
      filters: [
        { key: "pays", label: "Pays", type: "multiselect", options: filterChoices.pays },
        { key: "stationDemandee", label: "Destination", type: "multiselect", options: filterChoices.stationDemandee },
        { key: "categorieHotel", label: "Catégorie hôtel", type: "multiselect", options: filterChoices.categorieHotel, formatOption: formatStars },
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
        { key: "activitesDemandees", label: "Activités demandées", type: "bool" },
        { key: "seminaire", label: "Séminaire", type: "bool" },
        { key: "reservationEffectuee", label: "Réservation effectuée", type: "bool" },
        { key: "retourEffectueHotels", label: "Retour effectué aux hôtels", type: "bool" },
        { key: "contactEntreDansBrevo", label: "Contact dans Brevo", type: "bool" },
      ],
    },
  ], [filterChoices, hotelContacteOptions, hotelReponduOptions, anneeOptions]);

  const allFilters = filterGroups.flatMap((g) => g.filters);
  const favoriteFilterDefs = allFilters.filter((f) => favoriteFilters.includes(f.key));

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;
    onChange({ [name]: value });
  };

  const handleMultiToggle = (key: string, option: string) => {
    if (option === "__clear__") {
      onChange({ [key]: "all" });
      return;
    }
    const current = (filters as Record<string, string>)[key] ?? "all";
    const selected = current === "all" ? new Set<string>() : new Set(current.split(","));
    if (selected.has(option)) {
      selected.delete(option);
    } else {
      selected.add(option);
    }
    onChange({ [key]: selected.size === 0 ? "all" : Array.from(selected).join(",") });
  };

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Filtres</p>
          <h3 className="text-lg font-semibold text-slate-900">Affiner les offres</h3>
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

      {favoriteFilterDefs.length > 0 && (
        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {favoriteFilterDefs.map((def) => (
            <FilterFieldWithStar
              key={def.key}
              def={def}
              value={(filters as Record<string, string>)[def.key] ?? ""}
              onChange={handleChange}
              onMultiToggle={handleMultiToggle}
              inputClass={inputClass}
              isFavorite={true}
              onToggleFavorite={() => toggleFavoriteFilter(def.key)}
            />
          ))}
        </div>
      )}

      {showAll && (
        <div className={`${favoriteFilterDefs.length > 0 ? "mt-4 border-t border-slate-100 pt-4" : "mt-6"} space-y-5`}>
          {filterGroups.map((group) => {
            const defs = group.filters.filter((f) => !favoriteFilters.includes(f.key));
            if (defs.length === 0) return null;
            return (
              <div key={group.title}>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">{group.title}</p>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {defs.map((def) => (
                    <FilterFieldWithStar
                      key={def.key}
                      def={def}
                      value={(filters as Record<string, string>)[def.key] ?? ""}
                      onChange={handleChange}
                      onMultiToggle={handleMultiToggle}
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
