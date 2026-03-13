import type { BrochureSectionType } from "../types";

export const SECTION_TYPE_LABELS: Record<string, string> = {
  welcome: "Accueil",
  hotel: "Hôtel",
  venue: "Lieu",
  "activities-summer": "Activités été",
  "activities-winter": "Activités hiver",
  ski: "Domaine skiable",
  contacts: "Contacts",
  custom: "Section libre",
};

export const ADD_SECTION_OPTIONS: { type: BrochureSectionType; label: string; icon: string }[] = [
  { type: "custom", label: "Section libre (texte)", icon: "T" },
  { type: "welcome", label: "Accueil / Hero", icon: "H" },
  { type: "hotel", label: "Hôtel", icon: "\u{1F3E8}" },
  { type: "venue", label: "Lieu / Salle", icon: "\u{1F4CD}" },
  { type: "activities-summer", label: "Activités été", icon: "\u2600" },
  { type: "activities-winter", label: "Activités hiver", icon: "\u2744" },
  { type: "ski", label: "Domaine skiable", icon: "\u26F7" },
  { type: "contacts", label: "Contacts", icon: "\u{1F4DE}" },
];
