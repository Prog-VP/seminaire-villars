/**
 * fix-statuts-from-colors.js
 * Read Excel cell colors, determine actual statut from legend, compare with DB, fix mismatches.
 */
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const HIST_DIR = path.join(__dirname, '..', 'Historique');
const SUPABASE_URL = 'https://ueqguwfdhulrhpltkapb.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVlcWd1d2ZkaHVscmhwbHRrYXBiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjIxNTk2NywiZXhwIjoyMDg3NzkxOTY3fQ.9V1HKqyApx65xYsx2EFfg-ETLu0jEpaq3DMIlXcqDEA';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const FILES = {
  2023: 'Etat des offres et statistiques 2023.xlsx',
  2024: 'Etat des offres et statistiques 2024_new.xlsx',
  2025: 'Etat des offres et statistiques 2025.xlsx',
  2026: 'Etat des offres et statistiques 2026.xlsx',
};

// Color → statut mapping (unified across all years)
const COLOR_TO_STATUT = {
  // Reds → Pas d'offre envoyée
  'FF9B9B': "Pas d'offre envoyée",
  'FF7C80': "Pas d'offre envoyée",
  'FF9999': "Pas d'offre envoyée",
  'FFC9C9': "Pas d'offre envoyée",
  // Orange/salmon → Annulé
  'F8CBAD': 'Annulé',
  // Greens → Confirmé
  'E2F0D9': 'Confirmé',
  'C5E0B4': 'Confirmé',
  // Blues → Refusé (Sans réponse in Excel = Refusé in app)
  'DEEBF7': 'Refusé',
  'DAE3F3': 'Refusé',
  'BDD7EE': 'Refusé',
};

// Summary labels to skip
const SUMMARY_LABELS = [
  "pas d'offre", "annulé", "confirmé", "en cours", "sans réponse",
  "pas de confirmation", "pas d'hébergement",
];

function rgbToHex(rgb) {
  if (!rgb) return null;
  if (rgb.length === 8) rgb = rgb.slice(2);
  return rgb.toUpperCase();
}

function isSummaryRow(val) {
  const lower = val.toLowerCase();
  return SUMMARY_LABELS.some(s => lower.includes(s));
}

async function main() {
  // Load all DB offers
  const { data: dbOffers, error: dbErr } = await supabase
    .from('offers')
    .select('id, societeContact, statut, nomContact, pays');
  if (dbErr) throw dbErr;

  console.log(`DB offers: ${dbOffers.length}\n`);

  const fixes = []; // { id, societe, oldStatut, newStatut, year }
  let totalChecked = 0;

  for (const [yearStr, filename] of Object.entries(FILES)) {
    const year = Number(yearStr);
    console.log(`\n${'='.repeat(60)}`);
    console.log(`${year}: ${filename}`);
    console.log('='.repeat(60));

    const fp = path.join(HIST_DIR, filename);
    const wb = XLSX.read(fs.readFileSync(fp), { type: 'buffer', cellStyles: true });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const range = XLSX.utils.decode_range(ws['!ref']);

    // Find société column
    let societeCol = 0;

    // Read each data row (skip header rows 0-1)
    const excelRows = [];
    for (let r = 2; r <= range.e.r; r++) {
      const societeCell = ws[XLSX.utils.encode_cell({ r, c: societeCol })];
      const societe = societeCell ? String(societeCell.v || '').trim() : '';
      if (!societe || isSummaryRow(societe)) continue;

      // Get row color from first cell
      let color = null;
      for (let c = 0; c <= Math.min(range.e.c, 10); c++) {
        const ref = XLSX.utils.encode_cell({ r, c });
        const cell = ws[ref];
        if (cell && cell.s && cell.s.fgColor && cell.s.fgColor.rgb) {
          color = rgbToHex(cell.s.fgColor.rgb);
          break;
        }
      }

      // Skip header color
      if (color === 'AFABAB') continue;

      const statut = color ? (COLOR_TO_STATUT[color] || null) : 'En cours';
      excelRows.push({ row: r + 1, societe, color, statut });
    }

    console.log(`Excel data rows: ${excelRows.length}`);

    // Statut distribution from Excel
    const excelStats = {};
    for (const r of excelRows) {
      excelStats[r.statut || 'UNKNOWN'] = (excelStats[r.statut || 'UNKNOWN'] || 0) + 1;
    }
    console.log('Excel statut distribution:', excelStats);

    // Match each Excel row to a DB offer
    for (const exRow of excelRows) {
      totalChecked++;

      if (!exRow.statut) {
        console.log(`  WARNING: Unknown color #${exRow.color} for "${exRow.societe}"`);
        continue;
      }

      // Find matching DB offer
      const candidates = dbOffers.filter(o =>
        o.societeContact.toLowerCase() === exRow.societe.toLowerCase()
      );

      if (candidates.length === 0) {
        // Try partial match
        const partial = dbOffers.filter(o =>
          o.societeContact.toLowerCase().includes(exRow.societe.toLowerCase()) ||
          exRow.societe.toLowerCase().includes(o.societeContact.toLowerCase())
        );
        if (partial.length === 0) {
          console.log(`  NOT FOUND: "${exRow.societe}"`);
          continue;
        }
      }

      // If multiple matches, that's ok — all from same société
      for (const match of candidates) {
        if (match.statut !== exRow.statut) {
          fixes.push({
            id: match.id,
            societe: match.societeContact,
            oldStatut: match.statut,
            newStatut: exRow.statut,
            year,
          });
          // Remove from candidates to avoid double-matching
          const idx = dbOffers.indexOf(match);
          if (idx !== -1) dbOffers.splice(idx, 1);
          break; // Only fix one match per Excel row
        } else {
          // Already correct, remove to avoid double-matching
          const idx = dbOffers.indexOf(match);
          if (idx !== -1) dbOffers.splice(idx, 1);
          break;
        }
      }
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`RÉSUMÉ`);
  console.log('='.repeat(60));
  console.log(`Total rows checked: ${totalChecked}`);
  console.log(`Fixes needed: ${fixes.length}`);

  // Group by year
  for (const year of [2023, 2024, 2025, 2026]) {
    const yearFixes = fixes.filter(f => f.year === year);
    if (yearFixes.length === 0) continue;
    console.log(`\n--- ${year}: ${yearFixes.length} corrections ---`);
    for (const f of yearFixes) {
      console.log(`  "${f.societe}": ${f.oldStatut} → ${f.newStatut}`);
    }
  }

  // Apply fixes
  if (fixes.length > 0) {
    console.log(`\nApplying ${fixes.length} fixes...`);
    for (const f of fixes) {
      const { error } = await supabase
        .from('offers')
        .update({ statut: f.newStatut })
        .eq('id', f.id);
      if (error) {
        console.error(`  ERROR updating ${f.id}: ${error.message}`);
      }
    }
    console.log('Done!');
  }

  // Final DB statut distribution
  const { data: finalOffers } = await supabase.from('offers').select('statut');
  const finalStats = {};
  for (const o of finalOffers) {
    finalStats[o.statut || 'null'] = (finalStats[o.statut || 'null'] || 0) + 1;
  }
  console.log('\nFinal DB statut distribution:', finalStats);
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
