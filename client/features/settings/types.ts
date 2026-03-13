export type SettingType =
  | "transmisPar"
  | "traitePar"
  | "pays"
  | "langue"
  | "typeSociete"
  | "typeSejour"
  | "categorieHotel"
  | "stationDemandee"
  | "titreContact"
  | "statut"
  | "emailNotification";

export type SettingValue = {
  id: string;
  type: SettingType;
  label: string;
  color?: string | null;
};

export type SettingsMap = Record<SettingType, SettingValue[]>;
