"use client";

import { useMemo, useState } from "react";
import { useSettings } from "../context";
import { EditableSettingsList } from "./EditableSettingsList";
import type { SettingType } from "../types";

const SECTIONS: Array<{
  type: SettingType;
  title: string;
  description: string;
}> = [
  {
    type: "transmisPar",
    title: "Transmis par",
    description: "Canaux d'entrée (OT, SCIB, VP...).",
  },
  {
    type: "traitePar",
    title: "Traité par",
    description: "Collaborateurs pouvant suivre une offre.",
  },
  {
    type: "pays",
    title: "Pays",
    description: "Marchés proposés dans le formulaire.",
  },
  {
    type: "langue",
    title: "Langues",
    description: "Choix disponibles pour la communication.",
  },
  {
    type: "typeSociete",
    title: "Types de société",
    description: "Catégories d'interlocuteurs entrants.",
  },
  {
    type: "typeSejour",
    title: "Types de séjour",
    description: "Segments utilisés pour les demandes.",
  },
  {
    type: "categorieHotel",
    title: "Catégories d'hôtel",
    description: "Classements proposés aux clients.",
  },
  {
    type: "stationDemandee",
    title: "Stations demandées",
    description: "Destinations proposées (Villars, etc.).",
  },
  {
    type: "titreContact",
    title: "Titres de contact",
    description: "Civilités disponibles dans le formulaire.",
  },
];

const PLACEHOLDER_MAP: Record<SettingType, string> = {
  transmisPar: "Ajouter un canal",
  traitePar: "Ajouter des initiales",
  pays: "Ajouter un pays (ex. CH)",
  langue: "Ajouter une langue",
  typeSociete: "Ajouter un type de société",
  typeSejour: "Ajouter un type de séjour",
  categorieHotel: "Ajouter une catégorie",
  stationDemandee: "Ajouter une station",
  titreContact: "Ajouter un titre/civilité",
};

export function SettingsPage() {
  const { error, isLoading, hasLoaded, settings } = useSettings();
  const totals = useMemo(() => {
    return (Object.entries(settings) as [SettingType, typeof settings[SettingType]][]).reduce(
      (acc, [type, values]) => {
        acc[type] = values.length;
        return acc;
      },
      {} as Record<SettingType, number>
    );
  }, [settings]);
  const [activeType, setActiveType] = useState<SettingType>("transmisPar");

  const activeSection = SECTIONS.find((section) => section.type === activeType) ?? SECTIONS[0];

  return (
    <section className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {SECTIONS.map((section) => {
          const isActive = section.type === activeType;
          return (
            <button
              key={section.type}
              type="button"
              onClick={() => setActiveType(section.type)}
              className={`rounded-xl border px-4 py-3 text-left transition ${
                isActive
                  ? "border-transparent bg-gradient-to-br from-slate-800 to-slate-600 text-white"
                  : "border-slate-200 bg-white text-slate-700 shadow-sm hover:border-slate-300"
              }`}
            >
              <p className="text-xs font-medium uppercase tracking-wide">
                {section.title}
              </p>
              <p className={`mt-1 text-xs ${isActive ? "text-white/70" : "text-slate-500"}`}>
                {section.description}
              </p>
              <p className="mt-3 text-2xl font-semibold">
                {isLoading && !hasLoaded ? "..." : totals[section.type]}
              </p>
              <p className={`text-xs ${isActive ? "text-white/70" : "text-slate-500"}`}>
                {totals[section.type] > 1 ? "entrées" : "entrée"}
              </p>
            </button>
          );
        })}
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <p>{error}</p>
        </div>
      )}

      {hasLoaded || !isLoading ? (
        <EditableSettingsList
          key={activeSection.type}
          type={activeSection.type}
          title={activeSection.title}
          description={activeSection.description}
          placeholder={PLACEHOLDER_MAP[activeSection.type]}
        />
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white px-5 py-10 text-center text-sm text-slate-500">
          Chargement des réglages...
        </div>
      )}
    </section>
  );
}
