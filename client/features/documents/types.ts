export const MASTER_POWERPOINT_LANGS = ["FR", "EN", "DE"] as const;

export type MasterPowerPointLang = (typeof MASTER_POWERPOINT_LANGS)[number];

export type DocumentBlock = {
  id: string;
  destination: string;
  season: string;
  lang: string;
  name: string;
  filePath: string;
  createdAt: string;
};

export type MasterPowerPointMap = Record<MasterPowerPointLang, DocumentBlock | null>;
