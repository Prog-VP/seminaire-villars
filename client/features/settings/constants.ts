import type { SettingType, SettingsMap } from "./types";

export const DEFAULT_SETTING_OPTIONS: Record<SettingType, string[]> = {
  transmisPar: [
    "DIRECT (OT, AV, formulaire)",
    "SCIB BE",
    "SCIB UK",
    "SCIB FR",
    "SCIB DE",
    "AUTRE",
    "SCIB NORDICS",
    "VP",
  ],
  traitePar: ["MP", "RC", "LL", "GC"],
  pays: ["CH", "FR", "UK", "BE", "DE", "PL", "CAN", "CZ"],
  langue: ["Français", "Allemand", "Anglais"],
  typeSociete: ["Agence", "Entreprise"],
  typeSejour: ["Groupe", "Incentive", "Séminaire"],
  categorieHotel: ["1*", "2*", "3*", "4*", "5*"],
  stationDemandee: ["Villars", "Diablerets"],
  titreContact: ["M.", "Mme", "Mx", "Autre"],
};

export const EMPTY_SETTINGS_MAP: SettingsMap = {
  transmisPar: [],
  traitePar: [],
  pays: [],
  langue: [],
  typeSociete: [],
  typeSejour: [],
  categorieHotel: [],
  stationDemandee: [],
  titreContact: [],
};
