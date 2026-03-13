/**
 * Import "Etat des offres et statistiques 2025.xlsx" into Supabase offers table.
 *
 * Usage:  node import-excel.js [--dry-run]
 *
 * --dry-run : affiche les offres transformées sans écrire en base
 */

const XLSX = require("xlsx");
const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

// ─── Config ───────────────────────────────────────────────────────────────────
const EXCEL_PATH = path.join(__dirname, "Etat des offres et statistiques 2025.xlsx");
const SHEET_NAME = "2025";
const DRY_RUN = process.argv.includes("--dry-run");

// ─── Env ──────────────────────────────────────────────────────────────────────
const env = {};
for (const line of fs.readFileSync(path.join(__dirname, ".env.local"), "utf8").split("\n")) {
  const idx = line.indexOf("=");
  if (idx > 0) env[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
}
const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

// ─── Mappings ─────────────────────────────────────────────────────────────────
const MOIS_FR = {
  janvier: 1, février: 2, mars: 3, avril: 4, mai: 5, juin: 6,
  juillet: 7, août: 8, septembre: 9, octobre: 10, novembre: 11, décembre: 12,
};

const PAYS_MAP = {
  CH: "🇨🇭 CH", FR: "🇫🇷 FR", BE: "🇧🇪 BE", DE: "🇩🇪 DE",
  UK: "🇬🇧 UK", PL: "🇵🇱 PL", CAN: "🇨🇦 CAN", CZ: "🇨🇿 CZ",
  LUX: "🇱🇺 LUX",
};

const LANGUE_MAP = {
  FR: "Français", DE: "Allemand", EN: "Anglais",
  // "BE" et "CH" = Français par défaut (pays francophones dans ce contexte)
  BE: "Français", CH: "Français",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function str(val) {
  if (val === null || val === undefined || val === "") return "";
  return String(val).trim();
}

function parseMois(moisStr) {
  if (!moisStr) return null;
  return MOIS_FR[str(moisStr).toLowerCase()] ?? null;
}

/** Parse "26-30" or "13" into { startDay, endDay } */
function parseDayRange(val) {
  const s = str(val);
  if (!s) return null;
  const match = s.match(/^(\d{1,2})\s*[-–]\s*(\d{1,2})$/);
  if (match) return { startDay: parseInt(match[1]), endDay: parseInt(match[2]) };
  const single = s.match(/^(\d{1,2})$/);
  if (single) return { startDay: parseInt(single[1]), endDay: null };
  return null;
}

function buildDate(year, month, day) {
  if (!year || !month || !day) return null;
  const y = parseInt(year);
  const m = String(month).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseRelanceDate(val) {
  const s = str(val);
  if (!s) return null;
  // Match patterns like "le 05.03.2025" or "le 15.09.2025"
  const match = s.match(/(\d{2})\.(\d{2})\.(\d{4})/);
  if (match) return `${match[3]}-${match[2]}-${match[1]}`;
  return null;
}

function normalizeCategorieHotel(val) {
  const s = str(val);
  if (!s || s === "-") return { categorie: "", autre: "" };
  // Check for standard star ratings
  const starMatch = s.match(/^(\d)\s*\*$/);
  if (starMatch) return { categorie: `${starMatch[1]}*`, autre: "" };
  // Check for ranges like "4-5*" or "3*-4*"
  const rangeMatch = s.match(/(\d)\s*\*?\s*[-–]\s*(\d)\s*\*/);
  if (rangeMatch) {
    const stars = [];
    for (let i = parseInt(rangeMatch[1]); i <= parseInt(rangeMatch[2]); i++) stars.push(`${i}*`);
    return { categorie: stars.join(","), autre: "" };
  }
  // Check for "3* - 4* - 5*" format
  const multiMatch = s.match(/(\d)\s*\*\s*[-–]\s*(\d)\s*\*\s*[-–]\s*(\d)\s*\*/);
  if (multiMatch) {
    return { categorie: `${multiMatch[1]}*,${multiMatch[2]}*,${multiMatch[3]}*`, autre: "" };
  }
  // Specific patterns
  if (s.includes("4/5*")) return { categorie: "4*,5*", autre: "" };
  if (s.match(/^4\s*$/)) return { categorie: "4*", autre: "" };
  // Everything else goes to "autre"
  return { categorie: "", autre: s };
}

function normalizeReservation(val) {
  const s = str(val).toLowerCase();
  if (!s) return { statut: "brouillon", reservationEffectuee: false };
  if (s.includes("confirmé") || s.includes("séjours confirmés") || s === "oui/activity only")
    return { statut: "confirmee", reservationEffectuee: true };
  if (s.includes("décliné") || s.includes("déclinées") || s === "pas de réponses" || s.includes("no rép"))
    return { statut: "perdue", reservationEffectuee: false };
  if (s === "en cours")
    return { statut: "en_cours", reservationEffectuee: false };
  if (s === "pas d'offre")
    return { statut: "brouillon", reservationEffectuee: false };
  return { statut: "brouillon", reservationEffectuee: false };
}

function normalizeTransmisPar(val) {
  const s = str(val);
  if (!s) return "";
  // Normalize "DIRECT" to match settings
  if (s === "DIRECT") return "DIRECT (OT, AV, formulaire)";
  return s;
}

function normalizeTraitePar(val) {
  const s = str(val);
  if (!s) return "";
  // "RC/GC" → take first
  if (s === "RC/GC") return "RC";
  // "LK" not in settings, keep as-is (will need to be added to settings or mapped)
  return s;
}

// ─── Parse Excel ──────────────────────────────────────────────────────────────
const wb = XLSX.readFile(EXCEL_PATH);
const ws = wb.Sheets[SHEET_NAME];
const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });

// Row 0 = headers, Row 1 = sub-headers, Data starts at row 2
const offers = [];
const warnings = [];

for (let r = 2; r < rows.length; r++) {
  const row = rows[r];
  const societe = str(row[0]);
  if (!societe) continue;

  // ── Type société ──
  const isAgence = row[3] === 1 || row[3] === "1";
  const isEntreprise = row[4] === 1 || row[4] === "1";
  const typeSociete = isAgence ? "Agence" : isEntreprise ? "Entreprise" : "";

  // ── Pays ──
  const paysRaw = str(row[5]);
  const pays = PAYS_MAP[paysRaw] ?? paysRaw;
  if (paysRaw && !PAYS_MAP[paysRaw]) warnings.push(`Row ${r + 1} (${societe}): pays inconnu "${paysRaw}"`);

  // ── Langue ──
  const langueRaw = str(row[7]);
  const langue = LANGUE_MAP[langueRaw] ?? "";
  if (langueRaw && !LANGUE_MAP[langueRaw]) warnings.push(`Row ${r + 1} (${societe}): langue inconnue "${langueRaw}"`);

  // ── Dates séjour ──
  const dayRange = parseDayRange(row[11]);
  const moisSejour = parseMois(row[12]);
  const anneeSejour = row[13] ? parseInt(row[13]) : 2025;
  let dateOptions = [];
  if (dayRange && moisSejour) {
    const du = buildDate(anneeSejour, moisSejour, dayRange.startDay);
    const au = dayRange.endDay ? buildDate(anneeSejour, moisSejour, dayRange.endDay) : "";
    if (du) dateOptions.push({ du, au: au || "" });
  }

  // ── Date envoi offre ──
  const jourEnvoi = row[1] ? parseInt(row[1]) : null;
  const moisEnvoi = parseMois(row[2]);
  const dateEnvoiOffre = buildDate(2025, moisEnvoi, jourEnvoi);

  // ── Activité uniquement ──
  const activiteRaw = str(row[14]).toLowerCase();
  const activiteUniquement = activiteRaw === "oui";

  // ── Type séjour (binary cols 18, 19) ──
  const isIncentive = row[18] === 1 || row[18] === "1";
  const isSeminaire = row[19] === 1 || row[19] === "1";
  let typeSejour = "";
  if (isIncentive) typeSejour = "Incentive";
  else if (isSeminaire) typeSejour = "Séminaire";

  // ── Station (binary cols 21, 22) ──
  const isVillars = row[21] === 1 || row[21] === "1";
  const isDiablerets = row[22] === 1 || row[22] === "1";
  let stationDemandee = "";
  if (isVillars) stationDemandee = "Villars";
  else if (isDiablerets) stationDemandee = "Diablerets";

  // ── Titre contact (normalize "M" → "M.", handle "M\r\nMme") ──
  let titreContact = str(row[8]);
  if (titreContact === "M") titreContact = "M.";
  else if (titreContact.includes("\n") || titreContact.includes("\r")) titreContact = titreContact.split(/[\r\n]+/)[0].trim();
  if (titreContact === "M") titreContact = "M.";

  // ── Catégorie hôtel ──
  const { categorie, autre: categorieHotelAutre } = normalizeCategorieHotel(row[20]);

  // ── Réservation / Statut ──
  const { statut, reservationEffectuee } = normalizeReservation(row[26]);

  // ── Contact Brevo ──
  const brevoRaw = str(row[27]).toLowerCase();
  const contactEntreDansBrevo = brevoRaw.includes("oui") || brevoRaw.includes("brevo");

  // ── Relance ──
  const relanceEffectueeLe = parseRelanceDate(row[24]);

  // ── Séminaire (from typeSejour) ──
  const seminaire = isSeminaire;

  const offer = {
    societeContact: societe,
    typeSociete,
    pays,
    emailContact: str(row[6]) || null,
    langue: langue || null,
    titreContact: titreContact || null,
    nomContact: str(row[9]) || null,
    prenomContact: str(row[10]) || null,
    nombrePax: row[16] ? parseInt(row[16]) : null,
    transmisPar: normalizeTransmisPar(row[17]) || null,
    typeSejour: typeSejour || null,
    categorieHotel: categorie || "",
    categorieHotelAutre: categorieHotelAutre || null,
    stationDemandee: stationDemandee || null,
    traitePar: normalizeTraitePar(row[29]) || null,
    dateOptions: dateOptions.length > 0 ? dateOptions : [{ du: "", au: "" }],
    dateEnvoiOffre: dateEnvoiOffre || null,
    relanceEffectueeLe: relanceEffectueeLe || null,
    reservationEffectuee,
    contactEntreDansBrevo,
    statut,
    activiteUniquement,
    seminaire,
    seminaireJournee: false,
    seminaireDemiJournee: false,
    seminaireDetails: null,
    // Remarques → autres
    autres: str(row[23]) || null,
    // Suivis → on ajoute comme commentaire séparé si besoin
    _suivis: str(row[28]) || null,
    _relanceText: str(row[24]) || null,
    _row: r + 1,
  };

  offers.push(offer);
}

// ─── Output ───────────────────────────────────────────────────────────────────
console.log(`\n📋 ${offers.length} offres parsées depuis le fichier Excel\n`);

if (warnings.length > 0) {
  console.log("⚠️  Warnings:");
  warnings.forEach((w) => console.log("  " + w));
  console.log();
}

if (DRY_RUN) {
  console.log("🔍 DRY RUN — Aperçu des 5 premières offres:\n");
  for (const o of offers.slice(0, 5)) {
    const { _suivis, _relanceText, _row, ...rest } = o;
    console.log(`--- Row ${_row}: ${rest.societeContact} ---`);
    for (const [k, v] of Object.entries(rest)) {
      if (v !== null && v !== "" && v !== false) console.log(`  ${k}: ${JSON.stringify(v)}`);
    }
    if (_suivis) console.log(`  [suivis]: ${_suivis.substring(0, 80)}`);
    console.log();
  }
  console.log("Aucune donnée écrite. Relancer sans --dry-run pour importer.");
  process.exit(0);
}

// ─── Insert ───────────────────────────────────────────────────────────────────
(async () => {
  let created = 0;
  let errors = 0;

  for (const offer of offers) {
    const { _suivis, _relanceText, _row, ...payload } = offer;

    // Check if offer already exists (by societeContact + dateEnvoiOffre)
    let query = supabase
      .from("offers")
      .select("id")
      .eq("societeContact", payload.societeContact);

    if (payload.dateEnvoiOffre) {
      query = query.eq("dateEnvoiOffre", payload.dateEnvoiOffre);
    }

    const { data: existing } = await query;
    if (existing && existing.length > 0) {
      console.log(`⏭️  Row ${_row}: "${payload.societeContact}" existe déjà, skip`);
      continue;
    }

    // Insert offer
    const { data: inserted, error } = await supabase
      .from("offers")
      .insert(payload)
      .select("id")
      .single();

    if (error) {
      console.log(`❌ Row ${_row}: "${payload.societeContact}" — ${error.message}`);
      errors++;
      continue;
    }

    // Insert suivis as comment if present
    if (_suivis && inserted) {
      await supabase.from("offer_comments").insert({
        offer_id: inserted.id,
        author: payload.traitePar || "Import",
        content: _suivis,
        date: payload.dateEnvoiOffre || null,
      });
    }

    // Insert relance text as comment if it contains useful info beyond the date
    if (_relanceText && inserted && _relanceText.length > 20) {
      await supabase.from("offer_comments").insert({
        offer_id: inserted.id,
        author: payload.traitePar || "Import",
        content: `Relance: ${_relanceText}`,
        date: offer.relanceEffectueeLe || null,
      });
    }

    console.log(`✅ Row ${_row}: "${payload.societeContact}" importé (${inserted.id})`);
    created++;
  }

  console.log(`\n🏁 Import terminé: ${created} créées, ${errors} erreurs, ${offers.length - created - errors} skippées`);
})();
