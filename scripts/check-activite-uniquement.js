/**
 * check-activite-uniquement.js
 * Check all offers: activiteUniquement should only be true when nuits = 0
 * Rule: activités demandées + 0 nuits → activiteUniquement = true
 *       activités demandées + >0 nuits → activiteUniquement = false
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

const SUMMARY_LABELS = [
  "pas d'offre", "annulé", "confirmé", "en cours", "sans réponse",
  "pas de confirmation", "pas d'hébergement",
];

async function main() {
  const { data: dbOffers } = await supabase
    .from('offers')
    .select('id, societeContact, activiteUniquement, nombreDeNuits');

  const remaining = [...dbOffers];
  const fixes = [];

  for (const [yearStr, filename] of Object.entries(FILES)) {
    const year = Number(yearStr);
    const fp = path.join(HIST_DIR, filename);
    const wb = XLSX.read(fs.readFileSync(fp), { type: 'buffer', cellDates: true });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const range = XLSX.utils.decode_range(ws['!ref']);

    // Find activités and nuits columns
    let activCol = -1, nuitsCol = -1;
    for (let c = 0; c <= range.e.c; c++) {
      const c0 = ws[XLSX.utils.encode_cell({ r: 0, c })];
      const c1 = ws[XLSX.utils.encode_cell({ r: 1, c })];
      const h0 = c0 ? String(c0.v || '').toLowerCase() : '';
      const h1 = c1 ? String(c1.v || '').toLowerCase() : '';
      if (h0.includes('activit')) activCol = c;
      if (h0.includes('nuit') || h1.includes('nuit')) nuitsCol = c;
    }

    console.log(`\n=== ${year} === activCol=${activCol} nuitsCol=${nuitsCol}`);

    for (let r = 2; r <= range.e.r; r++) {
      const societeCell = ws[XLSX.utils.encode_cell({ r, c: 0 })];
      const societe = societeCell ? String(societeCell.v || '').trim() : '';
      if (!societe || SUMMARY_LABELS.some(s => societe.toLowerCase().includes(s))) continue;

      const activCell = ws[XLSX.utils.encode_cell({ r, c: activCol })];
      const nuitsCell = ws[XLSX.utils.encode_cell({ r, c: nuitsCol })];

      const activRaw = activCell ? String(activCell.v || '').trim().toLowerCase() : '';
      const nuitsRaw = nuitsCell ? Number(nuitsCell.v) : 0;
      const hasActivites = activRaw === 'oui' || activRaw === '1' || activRaw === 'x';
      const nuits = isNaN(nuitsRaw) ? 0 : nuitsRaw;

      // Rule: activiteUniquement = hasActivites AND nuits === 0
      const shouldBeActiviteOnly = hasActivites && nuits === 0;

      // Find DB match
      const idx = remaining.findIndex(o =>
        o.societeContact.toLowerCase() === societe.toLowerCase()
      );
      if (idx === -1) continue;

      const match = remaining[idx];
      remaining.splice(idx, 1);

      const dbActivite = match.activiteUniquement === true;

      if (dbActivite !== shouldBeActiviteOnly) {
        fixes.push({
          id: match.id,
          societe,
          year,
          hasActivites,
          nuits,
          shouldBeActiviteOnly,
          dbActivite,
        });
        console.log(`  FIX: "${societe}" activ=${hasActivites} nuits=${nuits} → activiteUniquement should be ${shouldBeActiviteOnly} (db=${dbActivite})`);
      }
    }
  }

  console.log(`\n=== RÉSUMÉ ===`);
  console.log(`Fixes needed: ${fixes.length}`);

  if (fixes.length > 0) {
    console.log('\nApplying fixes...');
    for (const f of fixes) {
      await supabase.from('offers').update({ activiteUniquement: f.shouldBeActiviteOnly }).eq('id', f.id);
      console.log(`  "${f.societe}": activiteUniquement ${f.dbActivite} → ${f.shouldBeActiviteOnly}`);
    }
    console.log('Done!');
  }
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
