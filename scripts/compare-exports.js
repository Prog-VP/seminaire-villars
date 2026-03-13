/**
 * compare-exports.js
 * Compare historical Excel files (2023-2026) with DB export to find all differences.
 * Usage: NODE_PATH=client/node_modules node scripts/compare-exports.js
 */
const XLSX = require('xlsx');
const path = require('path');

const HIST_DIR = path.join(__dirname, '..', 'Historique');

// --- Read DB export ---
function readDbExport() {
  const fp = path.join(HIST_DIR, 'offres_export_2026-03-13 (1).xlsx');
  const wb = XLSX.read(require('fs').readFileSync(fp), { type: 'buffer', cellDates: true });
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '' });
  return rows;
}

// --- Read structured JSON files ---
function readStructured(year) {
  const fp = path.join(HIST_DIR, `${year}_structured.json`);
  const data = JSON.parse(require('fs').readFileSync(fp, 'utf-8'));
  return data.offers || data;
}

// --- Normalize for comparison ---
function norm(v) {
  if (v === null || v === undefined) return '';
  return String(v).trim();
}

function normDate(v) {
  if (!v) return '';
  if (v instanceof Date) {
    const y = v.getFullYear();
    const m = String(v.getMonth() + 1).padStart(2, '0');
    const d = String(v.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  const s = String(v).trim();
  // dd.mm.yyyy → yyyy-mm-dd
  const m = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  // Already ISO?
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  return s;
}

function normBool(v) {
  if (v === true || v === 'Oui' || v === 'oui' || v === '1' || v === 1) return true;
  if (v === false || v === 'Non' || v === 'non' || v === '0' || v === 0) return false;
  if (v === '' || v === null || v === undefined) return false;
  return String(v).trim().toLowerCase() === 'oui';
}

// --- Normalization maps (same as insert-offers.js) ---
const TRANSMIS_PAR_MAP = {
  'direct': 'DIRECT (OT, AV, formulaire)',
  'Direct': 'DIRECT (OT, AV, formulaire)',
  'DIRECT': 'DIRECT (OT, AV, formulaire)',
  'SCIB Nordic': 'SCIB NORDICS',
  'SCIB Nordics': 'SCIB NORDICS',
  'formulaire Jotform': 'DIRECT (OT, AV, formulaire)',
};

const TRAITE_PAR_MAP = {
  'Lk': 'LK',
  'lk': 'LK',
  'Rc': 'RC',
  'rc': 'RC',
  'gc': 'GC',
  'Gc': 'GC',
  'Ig': 'IG',
  'ig': 'IG',
  'gh': 'GH',
  'Gh': 'GH',
  'Ll': 'LL',
  'll': 'LL',
  'ym': 'YM',
  'Ym': 'YM',
  'mp': 'MP',
  'Mp': 'MP',
  'tr': 'TR',
  'Tr': 'TR',
};

const LANGUE_MAP = {
  'français': 'Français',
  'Francais': 'Français',
  'francais': 'Français',
  'anglais': 'Anglais',
  'allemand': 'Allemand',
  'FR': 'Français',
  'EN': 'Anglais',
  'DE': 'Allemand',
};

const PAYS_MAP = {
  'LUX': 'LU',
  'SWE': 'SE',
  'UAE': 'AE',
  'UK': 'GB',
  'CAN': 'CA',
  'NED': 'NL',
};

const STATUT_MAP = {
  'confirmé': 'Confirmé',
  'Confirme': 'Confirmé',
  'confirme': 'Confirmé',
  'refusé': 'Refusé',
  'Refuse': 'Refusé',
  'en cours': 'En cours',
  'En Cours': 'En cours',
  'annulé': 'Annulé',
  'Annule': 'Annulé',
  'annule': 'Annulé',
  "pas d'offre envoyée": "Pas d'offre envoyée",
  "Pas d'offre envoyee": "Pas d'offre envoyée",
  "pas d'offre": "Pas d'offre envoyée",
};

function normTransmisPar(v) {
  if (!v) return '';
  return TRANSMIS_PAR_MAP[v] || v;
}

function normTraitePar(v) {
  if (!v) return '';
  return TRAITE_PAR_MAP[v] || v;
}

function normLangue(v) {
  if (!v) return '';
  return LANGUE_MAP[v] || v;
}

function normPays(v) {
  if (!v) return '';
  return PAYS_MAP[v] || v;
}

function normStatut(v) {
  if (!v) return '';
  return STATUT_MAP[v] || STATUT_MAP[v.toLowerCase()] || v;
}

// --- Parse date options from structured JSON ---
function parseDateOpts(offer) {
  const opts = offer.offer?.dateOptions || [];
  return opts.map(o => ({
    du: o.du || '',
    au: o.au || '',
    approx: !!o.approximatif,
  }));
}

// --- Parse date options from DB export ---
function parseDbDateOpts(row) {
  const du = norm(row['Date option du']);
  const au = norm(row['Date option au']);
  if (!du && !au) return [];
  const duParts = du.split('|').map(s => normDate(s.trim())).filter(Boolean);
  const auParts = au.split('|').map(s => normDate(s.trim())).filter(Boolean);
  const count = Math.max(duParts.length, auParts.length);
  const result = [];
  for (let i = 0; i < count; i++) {
    result.push({ du: duParts[i] || '', au: auParts[i] || '' });
  }
  return result;
}

// --- Main comparison ---
function main() {
  const dbRows = readDbExport();
  console.log(`DB export: ${dbRows.length} rows\n`);

  // Index DB rows by société (lowercase) for matching
  // We'll need to match structured offers to DB rows

  const allDiffs = [];
  let totalStructured = 0;

  for (const year of [2023, 2024, 2025, 2026]) {
    const structured = readStructured(year);
    console.log(`${year}: ${structured.length} structured offers`);
    totalStructured += structured.length;

    for (let i = 0; i < structured.length; i++) {
      const src = structured[i];
      const offer = src.offer || {};
      const societe = norm(offer.societeContact);

      if (!societe) continue;

      // Find matching DB row(s) by société + pays + approximate date
      const candidates = dbRows.filter(r => {
        const dbSociete = norm(r['Société']);
        if (dbSociete.toLowerCase() !== societe.toLowerCase()) return false;
        // Also match on pays if available
        const srcPays = normPays(norm(offer.pays));
        const dbPays = norm(r['Pays']);
        if (srcPays && dbPays && srcPays !== dbPays) return false;
        return true;
      });

      if (candidates.length === 0) {
        allDiffs.push({
          year,
          row: i + 1,
          societe,
          type: 'MISSING_IN_DB',
          detail: `Offre "${societe}" (${year}) absente de l'export DB`,
        });
        continue;
      }

      // Try to find best match using more fields
      let best = null;
      let bestScore = -1;
      for (const c of candidates) {
        let score = 0;
        // Match on transmisPar
        if (normTransmisPar(norm(offer.transmisPar)) === norm(c['Transmis par'])) score++;
        // Match on traitePar
        if (normTraitePar(norm(offer.traitePar)) === norm(c['Traité par'])) score++;
        // Match on statut
        if (normStatut(norm(offer.statut)) === norm(c['Statut'])) score++;
        // Match on pax
        if (offer.nombrePax && Number(offer.nombrePax) === Number(c['Nombre de participants'])) score++;
        // Match on type sejour
        if (norm(offer.typeSejour) === norm(c['Type de séjour'])) score++;
        // Match on nom contact
        if (norm(offer.nomContact) && norm(offer.nomContact).toLowerCase() === norm(c['Nom']).toLowerCase()) score++;
        if (score > bestScore) {
          bestScore = score;
          best = c;
        }
      }

      if (!best) best = candidates[0];

      // Now compare fields
      const diffs = [];

      const compareField = (label, srcVal, dbVal) => {
        const s = norm(srcVal);
        const d = norm(dbVal);
        if (s !== d && !(s === '' && d === '') && !(s === 'null' || d === 'null')) {
          diffs.push({ field: label, source: s, db: d });
        }
      };

      const compareNormField = (label, srcVal, dbVal, normFn) => {
        const s = normFn(norm(srcVal));
        const d = norm(dbVal);
        if (s !== d && !(s === '' && d === '')) {
          diffs.push({ field: label, source: s, db: d });
        }
      };

      compareField('Société', offer.societeContact, best['Société']);
      compareField('Type de société', offer.typeSociete, best['Type de société']);
      compareNormField('Pays', offer.pays, best['Pays'], normPays);
      compareField('Email', offer.emailContact, best['Email']);
      compareNormField('Langue', offer.langue, best['Langue'], normLangue);
      compareField('Titre', offer.titreContact, best['Titre']);
      compareField('Nom', offer.nomContact, best['Nom']);
      compareField('Prénom', offer.prenomContact, best['Prénom']);

      // Pax
      const srcPax = offer.nombrePax ? String(offer.nombrePax) : '';
      const dbPax = best['Nombre de participants'] ? String(best['Nombre de participants']) : '';
      if (srcPax !== dbPax) {
        diffs.push({ field: 'Nombre de participants', source: srcPax, db: dbPax });
      }

      compareNormField('Transmis par', offer.transmisPar, best['Transmis par'], normTransmisPar);
      compareNormField('Traité par', offer.traitePar, best['Traité par'], normTraitePar);
      compareField('Type de séjour', offer.typeSejour, best['Type de séjour']);
      compareNormField('Statut', offer.statut, best['Statut'], normStatut);
      compareField('Catégorie hôtel', offer.categorieHotel, best['Catégorie hôtel']);
      compareField('Station demandée', offer.stationDemandee, best['Station demandée']);

      // Date d'envoi
      const srcDateEnvoi = normDate(offer.dateEnvoiOffre);
      const dbDateEnvoi = normDate(best["Date d'envoi"]);
      if (srcDateEnvoi !== dbDateEnvoi) {
        diffs.push({ field: "Date d'envoi", source: srcDateEnvoi, db: dbDateEnvoi });
      }

      // Booleans
      const compareBool = (label, srcVal, dbVal) => {
        const s = normBool(srcVal);
        const d = normBool(dbVal);
        if (s !== d) {
          diffs.push({ field: label, source: String(s), db: String(d) });
        }
      };

      compareBool('Activité uniquement', offer.activiteUniquement, best['Activité uniquement']);
      compareBool('Séminaire', offer.seminaire, best['Séminaire']);
      compareBool('Réservation effectuée', offer.reservationEffectuee, best['Réservation effectuée']);
      compareBool('Retour effectué aux hôtels', offer.retourEffectueHotels, best['Retour effectué aux hôtels']);
      compareBool('Contact dans Brevo', offer.contactEntreDansBrevo, best['Contact dans Brevo']);

      // Date options comparison
      const srcOpts = parseDateOpts(src);
      const dbOpts = parseDbDateOpts(best);

      const srcOptStr = srcOpts.map(o => `${o.du}→${o.au}${o.approx ? ' (approx)' : ''}`).join(' | ');
      const dbOptStr = dbOpts.map(o => `${o.du}→${o.au}`).join(' | ');
      if (srcOpts.length !== dbOpts.length) {
        diffs.push({ field: 'Date options (nb)', source: `${srcOpts.length} options: ${srcOptStr}`, db: `${dbOpts.length} options: ${dbOptStr}` });
      } else {
        for (let j = 0; j < srcOpts.length; j++) {
          if (srcOpts[j].du !== dbOpts[j].du || srcOpts[j].au !== dbOpts[j].au) {
            diffs.push({ field: `Date option ${j + 1}`, source: `${srcOpts[j].du}→${srcOpts[j].au}`, db: `${dbOpts[j].du}→${dbOpts[j].au}` });
          }
        }
      }

      // Hotels comparison
      const srcHotels = (src.hotelSends || []).sort();
      const dbHotels = norm(best['Hôtels envoyés']).split(',').map(s => s.trim()).filter(Boolean).sort();

      if (srcHotels.length !== dbHotels.length || srcHotels.join(',') !== dbHotels.join(',')) {
        diffs.push({ field: 'Hôtels envoyés', source: srcHotels.join(', ') || '(aucun)', db: dbHotels.join(', ') || '(aucun)' });
      }

      // Notes comparison
      const srcNotes = norm(src.notes);
      const dbNotes = norm(best['Notes / Commentaires']);
      // Notes are transformed during import, so just check if source content appears in DB
      if (srcNotes && !dbNotes.includes(srcNotes.slice(0, 30))) {
        // Partial check - notes get prefixed with [Import] etc
        const dbNotesLower = dbNotes.toLowerCase();
        const srcNotesLower = srcNotes.toLowerCase();
        if (!dbNotesLower.includes(srcNotesLower.slice(0, Math.min(30, srcNotesLower.length)))) {
          diffs.push({ field: 'Notes', source: srcNotes.slice(0, 80) + (srcNotes.length > 80 ? '...' : ''), db: dbNotes.slice(0, 80) + (dbNotes.length > 80 ? '...' : '') });
        }
      }

      if (diffs.length > 0) {
        allDiffs.push({
          year,
          row: i + 1,
          societe,
          dbId: best['ID'],
          dbNumero: best['N° offre'],
          type: 'FIELD_DIFF',
          diffs,
        });
      }
    }
  }

  // Check for DB rows not found in any structured file
  const allStructuredSocietes = new Set();
  for (const year of [2023, 2024, 2025, 2026]) {
    const structured = readStructured(year);
    for (const s of structured) {
      const soc = norm(s.offer?.societeContact).toLowerCase();
      if (soc) allStructuredSocietes.add(soc);
    }
  }

  const dbOnlyRows = dbRows.filter(r => {
    const soc = norm(r['Société']).toLowerCase();
    return soc && !allStructuredSocietes.has(soc);
  });

  console.log(`\nTotal structured: ${totalStructured}`);
  console.log(`DB rows not matched to any source: ${dbOnlyRows.length}`);
  for (const r of dbOnlyRows) {
    console.log(`  DB-only: "${r['Société']}" (${r['N° offre'] || 'no numero'}) Statut=${r['Statut']}`);
  }

  // Summary
  console.log(`\n${'='.repeat(80)}`);
  console.log('RÉSUMÉ DES DIFFÉRENCES');
  console.log('='.repeat(80));

  const missing = allDiffs.filter(d => d.type === 'MISSING_IN_DB');
  const fieldDiffs = allDiffs.filter(d => d.type === 'FIELD_DIFF');

  console.log(`\nOffres source absentes en DB: ${missing.length}`);
  for (const m of missing) {
    console.log(`  [${m.year}] Ligne ${m.row}: "${m.societe}"`);
  }

  console.log(`\nOffres avec différences de champs: ${fieldDiffs.length}`);

  // Group diffs by field
  const fieldStats = {};
  for (const d of fieldDiffs) {
    for (const diff of d.diffs) {
      if (!fieldStats[diff.field]) fieldStats[diff.field] = [];
      fieldStats[diff.field].push({ ...diff, societe: d.societe, year: d.year, row: d.row, dbNumero: d.dbNumero });
    }
  }

  console.log('\n--- Différences par champ ---\n');
  const sortedFields = Object.entries(fieldStats).sort((a, b) => b[1].length - a[1].length);
  for (const [field, items] of sortedFields) {
    console.log(`\n### ${field} (${items.length} différences)`);
    for (const item of items.slice(0, 50)) {
      console.log(`  [${item.year}] "${item.societe}" (${item.dbNumero || '?'}): source="${item.source}" → db="${item.db}"`);
    }
    if (items.length > 50) {
      console.log(`  ... et ${items.length - 50} autres`);
    }
  }
}

main();
