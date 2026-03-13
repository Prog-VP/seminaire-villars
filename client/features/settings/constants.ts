import type { SettingType, SettingsMap } from "./types";

export const DEFAULT_SETTING_OPTIONS: Record<SettingType, string[]> = {
  transmisPar: [],
  traitePar: [],
  pays: [],
  langue: [],
  typeSociete: [],
  typeSejour: [],
  categorieHotel: [],
  stationDemandee: [],
  titreContact: [],
  statut: [],
  emailNotification: [],
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
  statut: [],
  emailNotification: [],
};
