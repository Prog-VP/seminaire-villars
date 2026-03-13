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
};

export type SettingsMap = Record<SettingType, SettingValue[]>;
