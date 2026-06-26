import type { SettingType } from "../types";

export const SETTINGS_SECTIONS: Array<{
  type: SettingType;
  title: string;
  description: string;
}> = [
  {
    type: "categorieHotel",
    title: "Catégories d'hôtel",
    description: "Classements proposés aux clients.",
  },
  {
    type: "langue",
    title: "Langues",
    description: "Choix disponibles pour la communication.",
  },
  {
    type: "pays",
    title: "Pays",
    description: "Marchés proposés dans le formulaire.",
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
  {
    type: "traitePar",
    title: "Traité par",
    description: "Collaborateurs pouvant suivre une offre.",
  },
  {
    type: "transmisPar",
    title: "Transmis par",
    description: "Canaux d'entrée (OT, SCIB, VP...).",
  },
  {
    type: "typeSejour",
    title: "Types de séjour",
    description: "Segments utilisés pour les demandes.",
  },
  {
    type: "typeSociete",
    title: "Types de société",
    description: "Catégories d'interlocuteurs entrants.",
  },
  {
    type: "statut",
    title: "Statuts d'offre",
    description: "États possibles d'une offre (ex. Brouillon, Envoyé…).",
  },
];

export const SETTINGS_PLACEHOLDERS: Record<SettingType, string> = {
  transmisPar: "Ajouter un canal",
  traitePar: "Ajouter des initiales",
  pays: "Ajouter un pays (ex. CH)",
  langue: "Ajouter une langue",
  typeSociete: "Ajouter un type de société",
  typeSejour: "Ajouter un type de séjour",
  categorieHotel: "Ajouter une catégorie",
  stationDemandee: "Ajouter une station",
  titreContact: "Ajouter un titre/civilité",
  statut: "Ajouter un statut",
  emailNotification: "Ajouter un email",
};
