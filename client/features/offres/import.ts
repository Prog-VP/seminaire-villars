import * as XLSX from "xlsx";
import { createOffer, updateOffer, addOfferComment } from "./api";
import { normalizeStatut } from "./utils";
import type { Offer } from "./types";

// ---------------------------------------------------------------------------
// Column mapping: Excel header → Offer field
// ---------------------------------------------------------------------------

const COLUMN_MAP: Record<string, keyof Offer> = {
  "Société": "societeContact",
  "Type de société": "typeSociete",
  "Pays": "pays",
  "Email": "emailContact",
  "Téléphone": "telephoneContact",
  "Langue": "langue",
  "Titre": "titreContact",
  "Nom": "nomContact",
  "Prénom": "prenomContact",
  "Date option du": "dateOptions",
  "Date option au": "dateOptions",
  "Date confirmée du": "dateConfirmeeDu",
  "Date confirmée au": "dateConfirmeeAu",
  "Nombre de participants": "nombrePax",
  "Chambres simples": "chambresSimple",
  "Chambres doubles": "chambresDouble",
  "Chambres autres": "chambresAutre",
  "Type de séjour": "typeSejour",
  "Catégorie hôtel": "categorieHotel",
  "Catégorie hôtel autre": "categorieHotelAutre",
  "Station demandée": "stationDemandee",
  "Transmis par": "transmisPar",
  "Traité par": "traitePar",
  "Statut": "statut",
  "Activité uniquement": "activiteUniquement",
  "Activités demandées": "activitesDemandees",
  "Séminaire": "seminaire",
  "Séminaire journée": "seminaireJournee",
  "Séminaire demi-journée": "seminaireDemiJournee",
  "Détails séminaire": "seminaireDetails",
  "Date d'envoi": "dateEnvoiOffre",
  "Relance effectuée le": "relanceEffectueeLe",
  "Réservation effectuée": "reservationEffectuee",
  "Retour effectué aux hôtels": "retourEffectueHotels",
  "Contact dans Brevo": "contactEntreDansBrevo",
  "N° offre": "numeroOffre",
};


// ---------------------------------------------------------------------------
// Parse helpers
// ---------------------------------------------------------------------------

function parseBool(value: unknown): boolean | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  const s = String(value).toLowerCase().trim();
  if (["oui", "yes", "1", "true", "vrai", "x"].includes(s)) return true;
  if (["non", "no", "0", "false", "faux", ""].includes(s)) return false;
  return undefined;
}

function parseInteger(value: unknown): number | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? Math.round(n) : undefined;
}

function parseString(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined;
  const s = String(value).trim();
  return s || undefined;
}

function parseDate(value: unknown): string | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  // XLSX can return Date objects or serial numbers
  if (value instanceof Date) {
    return value.toISOString().split("T")[0];
  }
  if (typeof value === "number") {
    // Excel serial date
    const date = XLSX.SSF.parse_date_code(value);
    if (date) {
      const y = String(date.y).padStart(4, "0");
      const m = String(date.m).padStart(2, "0");
      const d = String(date.d).padStart(2, "0");
      return `${y}-${m}-${d}`;
    }
  }
  const s = String(value).trim();
  // Try ISO format
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  // Try dd.mm.yyyy or dd/mm/yyyy
  const match = s.match(/^(\d{1,2})[./](\d{1,2})[./](\d{4})$/);
  if (match) {
    return `${match[3]}-${match[2].padStart(2, "0")}-${match[1].padStart(2, "0")}`;
  }
  return undefined;
}

function isoToDMY(value?: string | null): string {
  if (!value) return "";
  const m = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[3]}.${m[2]}.${m[1]}` : value;
}

function parseStatut(value: unknown): string | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  return normalizeStatut(String(value).trim());
}

// ---------------------------------------------------------------------------
// Parse a single row into an Offer payload
// ---------------------------------------------------------------------------

function parseRow(row: Record<string, unknown>): Partial<Offer> | null {
  const payload: Record<string, unknown> = {};

  const societe = parseString(row["Société"]);
  if (!societe) return null; // Société is required

  payload.societeContact = societe;
  payload.typeSociete = parseString(row["Type de société"]) ?? "";
  payload.pays = parseString(row["Pays"]) ?? "";
  payload.emailContact = parseString(row["Email"]);
  payload.telephoneContact = parseString(row["Téléphone"]);
  payload.langue = parseString(row["Langue"]);
  payload.titreContact = parseString(row["Titre"]);
  payload.nomContact = parseString(row["Nom"]);
  payload.prenomContact = parseString(row["Prénom"]);

  // Date options (multiple ranges separated by " | ")
  const rawDu = String(row["Date option du"] ?? "");
  const rawAu = String(row["Date option au"] ?? "");
  const duParts = rawDu.split("|").map((s) => s.trim());
  const auParts = rawAu.split("|").map((s) => s.trim());
  const optCount = Math.max(duParts.filter(Boolean).length, auParts.filter(Boolean).length);
  if (optCount > 0) {
    payload.dateOptions = Array.from({ length: optCount }, (_, i) => ({
      du: parseDate(duParts[i]) ?? "",
      au: parseDate(auParts[i]) ?? "",
    }));
  }

  payload.dateConfirmeeDu = parseDate(row["Date confirmée du"]) ?? null;
  payload.dateConfirmeeAu = parseDate(row["Date confirmée au"]) ?? null;
  payload.nombrePax = parseInteger(row["Nombre de participants"]);
  payload.chambresSimple = parseInteger(row["Chambres simples"]);
  payload.chambresDouble = parseInteger(row["Chambres doubles"]);
  payload.chambresAutre = parseInteger(row["Chambres autres"]);
  payload.typeSejour = parseString(row["Type de séjour"]);
  payload.categorieHotel = parseString(row["Catégorie hôtel"])?.split(",").map((s) => s.trim()).filter(Boolean).join(",");
  payload.categorieHotelAutre = parseString(row["Catégorie hôtel autre"]);
  payload.stationDemandee = parseString(row["Station demandée"])?.split(",").map((s) => s.trim()).filter(Boolean).join(",");
  payload.transmisPar = parseString(row["Transmis par"]);
  payload.traitePar = parseString(row["Traité par"]);
  payload.statut = parseStatut(row["Statut"]) ?? "Brouillon";
  payload.activiteUniquement = parseBool(row["Activité uniquement"]);
  payload.activitesDemandees = parseBool(row["Activités demandées"]);
  payload.seminaire = parseBool(row["Séminaire"]);
  payload.seminaireJournee = parseBool(row["Séminaire journée"]);
  payload.seminaireDemiJournee = parseBool(row["Séminaire demi-journée"]);
  payload.seminaireDetails = parseString(row["Détails séminaire"]);
  payload.dateEnvoiOffre = parseDate(row["Date d'envoi"]) ?? null;
  payload.relanceEffectueeLe = parseDate(row["Relance effectuée le"]) ?? null;
  payload.reservationEffectuee = parseBool(row["Réservation effectuée"]);
  payload.retourEffectueHotels = parseBool(row["Retour effectué aux hôtels"]);
  payload.contactEntreDansBrevo = parseBool(row["Contact dans Brevo"]);
  payload.numeroOffre = parseString(row["N° offre"]);
  // Clean undefined values
  for (const key of Object.keys(payload)) {
    if (payload[key] === undefined) delete payload[key];
  }

  return payload as Partial<Offer>;
}

// ---------------------------------------------------------------------------
// Validation against allowed values
// ---------------------------------------------------------------------------

export type AllowedValues = {
  typeSociete?: string[];
  typeSejour?: string[];
  categorieHotel?: string[];
  stationDemandee?: string[];
  transmisPar?: string[];
  traitePar?: string[];
  langue?: string[];
  pays?: string[];
  titreContact?: string[];
  statut?: string[];
};

type ValidationError = { field: string; value: string; allowed: string[] };

function validateRow(row: Record<string, unknown>, allowed: AllowedValues): ValidationError[] {
  const errors: ValidationError[] = [];

  const checks: { excelCol: string; key: keyof AllowedValues; multi?: boolean }[] = [
    { excelCol: "Type de société", key: "typeSociete" },
    { excelCol: "Type de séjour", key: "typeSejour" },
    { excelCol: "Catégorie hôtel", key: "categorieHotel", multi: true },
    { excelCol: "Station demandée", key: "stationDemandee", multi: true },
    { excelCol: "Transmis par", key: "transmisPar" },
    { excelCol: "Traité par", key: "traitePar" },
    { excelCol: "Langue", key: "langue" },
    { excelCol: "Pays", key: "pays" },
    { excelCol: "Titre", key: "titreContact" },
    { excelCol: "Statut", key: "statut" },
  ];

  for (const { excelCol, key, multi } of checks) {
    const list = allowed[key];
    if (!list || list.length === 0) continue;

    const raw = parseString(row[excelCol]);
    if (!raw) continue;

    const values = multi
      ? raw.split(",").map((s) => s.trim()).filter(Boolean)
      : [raw.trim()];

    for (const v of values) {
      if (!list.includes(v)) {
        errors.push({ field: excelCol, value: v, allowed: list });
      }
    }
  }

  return errors;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export type ImportResult = {
  total: number;
  created: number;
  updated: number;
  skipped: number;
  errors: { row: number; message: string }[];
};

export async function importOffersFromFile(file: File, allowed?: AllowedValues): Promise<ImportResult> {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: "array", cellDates: true });
  const sheetName = wb.SheetNames[0];
  if (!sheetName) throw new Error("Le fichier ne contient aucune feuille.");

  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(
    wb.Sheets[sheetName],
  );

  const result: ImportResult = {
    total: rows.length,
    created: 0,
    updated: 0,
    skipped: 0,
    errors: [],
  };

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const payload = parseRow(row);

    if (!payload) {
      result.skipped += 1;
      result.errors.push({
        row: i + 2,
        message: "Colonne « Société » manquante ou vide.",
      });
      continue;
    }

    // Validate against allowed values
    if (allowed) {
      const valErrors = validateRow(row, allowed);
      if (valErrors.length > 0) {
        result.skipped += 1;
        for (const ve of valErrors) {
          result.errors.push({
            row: i + 2,
            message: `« ${ve.field} » : "${ve.value}" n'est pas une valeur autorisée. Valeurs possibles : ${ve.allowed.join(", ")}`,
          });
        }
        continue;
      }
    }

    const existingId = parseString(row["ID"]);

    // Extract "Notes / Commentaires" to save as comment
    const autresNote = parseString(row["Notes / Commentaires"]) ?? null;

    try {
      if (existingId) {
        await updateOffer(existingId, payload);
        if (autresNote) {
          await addOfferComment(existingId, { author: "Import", content: autresNote });
        }
        result.updated += 1;
      } else {
        const created = await createOffer(payload);
        if (autresNote && created?.id) {
          await addOfferComment(created.id, { author: "Import", content: autresNote });
        }
        result.created += 1;
      }
    } catch (err) {
      result.errors.push({
        row: i + 2,
        message: err instanceof Error ? err.message : "Erreur inconnue",
      });
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Generate template file
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Export offers to Excel (for bulk edit)
// ---------------------------------------------------------------------------

export function exportOffersXLSX(offers: Offer[]) {
  const rows = offers.map((o) => ({
    "ID": o.id,
    "N° offre": o.numeroOffre ?? "",
    "Société": o.societeContact,
    "Type de société": o.typeSociete ?? "",
    "Pays": o.pays ?? "",
    "Email": o.emailContact ?? "",
    "Téléphone": o.telephoneContact ?? "",
    "Langue": o.langue ?? "",
    "Titre": o.titreContact ?? "",
    "Nom": o.nomContact ?? "",
    "Prénom": o.prenomContact ?? "",
    "Date option du": (o.dateOptions ?? []).map((d) => isoToDMY(d.du)).join(" | "),
    "Date option au": (o.dateOptions ?? []).map((d) => isoToDMY(d.au)).join(" | "),
    "Date confirmée du": isoToDMY(o.dateConfirmeeDu),
    "Date confirmée au": isoToDMY(o.dateConfirmeeAu),
    "Date d'envoi": isoToDMY(o.dateEnvoiOffre),
    "Nombre de nuits": o.nombreDeNuits ?? "",
    "Nombre de participants": o.nombrePax ?? "",
    "Chambres simples": o.chambresSimple ?? "",
    "Chambres doubles": o.chambresDouble ?? "",
    "Chambres autres": o.chambresAutre ?? "",
    "Type de séjour": o.typeSejour ?? "",
    "Catégorie hôtel": (o.categorieHotel ?? "").split(",").map(s => s.trim()).filter(Boolean).join(", "),
    "Catégorie hôtel autre": o.categorieHotelAutre ?? "",
    "Station demandée": (o.stationDemandee ?? "").split(",").map(s => s.trim()).filter(Boolean).join(", "),
    "Transmis par": o.transmisPar ?? "",
    "Traité par": o.traitePar ?? "",
    "Hôtels envoyés": (o.hotelSendsNames ?? []).join(", "),
    "Statut": normalizeStatut(o.statut),
    "Activité uniquement": o.activiteUniquement ? "Oui" : "Non",
    "Activités demandées": o.activitesDemandees ? "Oui" : "Non",
    "Séminaire": o.seminaire ? "Oui" : "Non",
    "Séminaire journée": o.seminaireJournee ? "Oui" : "Non",
    "Séminaire demi-journée": o.seminaireDemiJournee ? "Oui" : "Non",
    "Détails séminaire": o.seminaireDetails ?? "",
    "Relance effectuée le": isoToDMY(o.relanceEffectueeLe),
    "Réservation effectuée": o.reservationEffectuee ? "Oui" : "Non",
    "Retour effectué aux hôtels": o.retourEffectueHotels ? "Oui" : "Non",
    "Contact dans Brevo": o.contactEntreDansBrevo ? "Oui" : "Non",
    "Notes / Commentaires": (o.comments ?? []).map((c) => `[${c.author}] ${c.content}`).join(" | "),
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  const headers = Object.keys(rows[0] ?? {});
  ws["!cols"] = headers.map((h) => ({ wch: Math.max(h.length + 2, 14) }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Offres");

  const wbOut = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([wbOut], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `offres_export_${new Date().toISOString().slice(0, 10)}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ---------------------------------------------------------------------------
// Generate template file
// ---------------------------------------------------------------------------

export function downloadImportTemplate(opts?: AllowedValues) {
  const headers = [...Object.keys(COLUMN_MAP), "Notes / Commentaires"];

  // Helpers pour les valeurs dynamiques — utilise les options DB si dispo, sinon "—"
  const v = (key: keyof AllowedValues) => (opts?.[key] ?? []).join(", ") || "—";
  const first = (key: keyof AllowedValues, fallback = "") => opts?.[key]?.[0] ?? fallback;

  // Ligne d'exemple utilisant les premières valeurs des données de base
  const exampleRow: Record<string, string> = {
    "Société": "Exemple SA",
    "Type de société": first("typeSociete"),
    "Pays": first("pays", "CH"),
    "Email": "contact@exemple.ch",
    "Téléphone": "+41 21 123 45 67",
    "Langue": first("langue", "Français"),
    "Titre": first("titreContact", "M."),
    "Nom": "Dupont",
    "Prénom": "Jean",
    "Date option du": "15.06.2026 | 22.06.2026",
    "Date option au": "18.06.2026 | 25.06.2026",
    "Date confirmée du": "",
    "Date confirmée au": "",
    "Nombre de participants": "30",
    "Chambres simples": "5",
    "Chambres doubles": "12",
    "Chambres autres": "",
    "Type de séjour": first("typeSejour"),
    "Catégorie hôtel": (opts?.categorieHotel ?? []).slice(0, 2).join(", "),
    "Catégorie hôtel autre": "",
    "Station demandée": (opts?.stationDemandee ?? []).join(", "),
    "Transmis par": first("transmisPar"),
    "Traité par": first("traitePar"),
    "Statut": first("statut", "Brouillon"),
    "Activité uniquement": "Non",
    "Activités demandées": "Non",
    "Séminaire": "Oui",
    "Séminaire journée": "Oui",
    "Séminaire demi-journée": "Non",
    "Détails séminaire": "Salle plénière 30 pers.",
    "Date d'envoi": "15.01.2026",
    "Relance effectuée le": "",
    "Réservation effectuée": "Non",
    "Retour effectué aux hôtels": "Non",
    "Contact dans Brevo": "Non",
    "N° offre": "",
    "Notes / Commentaires": "",
  };

  // Feuille 1 : données d'import avec exemple
  const wsData = XLSX.utils.json_to_sheet([exampleRow], { header: headers });
  wsData["!cols"] = headers.map((h) => {
    const content = exampleRow[h] ?? "";
    return { wch: Math.min(Math.max(content.length + 2, h.length + 2, 14), 50) };
  });

  // Feuille 2 : instructions dynamiques à partir des données de base
  const instructions = [
    ["GUIDE D'IMPORT — Conventions de saisie"],
    [],
    ["COLONNES ET FORMATS"],
    ["Colonne", "Format", "Valeurs possibles", "Notes"],
    ["Société", "Texte", "", "Obligatoire — les lignes sans société sont ignorées"],
    ["Type de société", "Texte (choix)", v("typeSociete"), ""],
    ["Pays", "Code (choix)", v("pays"), ""],
    ["Langue", "Texte (choix)", v("langue"), "Détermine la langue du formulaire hôtelier"],
    ["Titre", "Texte (choix)", v("titreContact"), ""],
    ["Date option du / au", "dd.mm.yyyy séparées par \" | \"", "", "Chaque paire du/au crée une option de date. Formats : dd.mm.yyyy, dd/mm/yyyy, yyyy-mm-dd"],
    ["Date confirmée du / au", "dd.mm.yyyy", "", "Remplir uniquement si une date est confirmée"],
    ["Type de séjour", "Texte (choix)", v("typeSejour"), ""],
    ["Catégorie hôtel", "Valeurs séparées par \",\"", v("categorieHotel"), "Plusieurs catégories possibles"],
    ["Catégorie hôtel autre", "Texte libre", "", "Catégorie hors étoiles"],
    ["Station demandée", "Valeurs séparées par \",\"", v("stationDemandee"), "Plusieurs stations possibles"],
    ["Transmis par", "Texte (choix)", v("transmisPar"), ""],
    ["Traité par", "Texte (choix)", v("traitePar"), ""],
    ["Statut", "Texte (choix)", v("statut"), ""],
    ["Booléens", "Oui / Non", "", "Activité uniquement, Activités demandées, Séminaire, Séminaire journée/demi-journée, Réservation, Retour hôtels, Brevo"],
    ["", "", "", "Valeurs acceptées : Oui/Non, Yes/No, Vrai/Faux, True/False, 1/0"],
    ["Notes / Commentaires", "Texte libre", "", "Importé comme commentaire (auteur « Import »)"],
    ["N° offre", "Texte", "", "Numéro de référence interne"],
    [],
    ["ASTUCES"],
    ["• Supprimez la ligne d'exemple avant d'importer vos données."],
    ["• La colonne « Société » est la seule obligatoire. Toutes les autres colonnes sont facultatives."],
    ["• Si une colonne ID est présente et remplie, la ligne met à jour l'offre existante au lieu d'en créer une nouvelle."],
    ["• Vous pouvez exporter vos offres existantes, les modifier dans Excel, puis les ré-importer pour mise à jour en masse."],
    ["• Les valeurs des champs à choix sont gérées dans Réglages > Données de base. Ce modèle reflète les valeurs actuelles."],
  ];
  const wsInstructions = XLSX.utils.aoa_to_sheet(instructions);
  wsInstructions["!cols"] = [{ wch: 28 }, { wch: 30 }, { wch: 50 }, { wch: 60 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, wsData, "Import offres");
  XLSX.utils.book_append_sheet(wb, wsInstructions, "Instructions");

  const wbOut = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([wbOut], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "modele_import_offres.xlsx";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
