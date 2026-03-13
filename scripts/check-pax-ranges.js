/**
 * check-pax-ranges.js
 * For each year, check if pax ranges from Excel were correctly handled:
 * - DB should have the MAX value
 * - The range should be noted in comments
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

function isSummaryRow(val) {
  return SUMMARY_LABELS.some(s => val.toLowerCase().includes(s));
}

async function main() {
  // Load all DB offers with comments
  const { data: dbOffers } = await supabase
    .from('offers')
    .select('id, societeContact, nombrePax, pays');
  const { data: dbComments } = await supabase
    .from('offer_comments')
    .select('offer_id, content');

  const commentsByOffer = {};
  for (const c of dbComments) {
    if (!commentsByOffer[c.offer_id]) commentsByOffer[c.offer_id] = [];
    commentsByOffer[c.offer_id].push(c.content);
  }

  // Track remaining offers for matching
  const remaining = [...dbOffers];
  const issues = [];

  for (const [yearStr, filename] of Object.entries(FILES)) {
    const year = Number(yearStr);
    console.log(`\n=== ${year} ===`);

    const fp = path.join(HIST_DIR, filename);
    const wb = XLSX.read(fs.readFileSync(fp), { type: 'buffer', cellDates: true });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const range = XLSX.utils.decode_range(ws['!ref']);

    // Find pax column - look for "nombre" or "pax" in headers
    let paxCol = -1;
    let societeCol = 0;
    for (let c = 0; c <= range.e.c; c++) {
      for (let r = 0; r <= 1; r++) {
        const cell = ws[XLSX.utils.encode_cell({ r, c })];
        if (cell) {
          const val = String(cell.v || '').toLowerCase();
          if (val.includes('pax') || val.includes('nombre de pers') || val.includes('participants')) {
            paxCol = c;
          }
        }
      }
    }

    if (paxCol === -1) {
      console.log('  Pax column not found, scanning all columns...');
      // Try to find it by looking at data patterns
      for (let c = 15; c <= Math.min(range.e.c, 25); c++) {
        const cell = ws[XLSX.utils.encode_cell({ r: 2, c })];
        if (cell && typeof cell.v === 'number' && cell.v >= 5 && cell.v <= 500) {
          paxCol = c;
          console.log(`  Guessed pax column: ${c}`);
          break;
        }
      }
    }

    console.log(`  Pax column index: ${paxCol}`);

    for (let r = 2; r <= range.e.r; r++) {
      const societeCell = ws[XLSX.utils.encode_cell({ r, c: societeCol })];
      const societe = societeCell ? String(societeCell.v || '').trim() : '';
      if (!societe || isSummaryRow(societe)) continue;

      const paxCell = ws[XLSX.utils.encode_cell({ r, c: paxCol })];
      if (!paxCell) continue;

      const rawPax = String(paxCell.v || '').trim();
      if (!rawPax) continue;

      // Check if this is a range (contains -, "à", "max", etc.)
      const isRange = /[-–]/.test(rawPax) || /\bà\b/i.test(rawPax) || /\bmax\b/i.test(rawPax) || /,/.test(rawPax);
      if (!isRange) continue;

      // This is a range — extract numbers
      const nums = rawPax.match(/\d+/g);
      if (!nums || nums.length < 2) continue;
      const maxVal = Math.max(...nums.map(Number));

      // Find matching DB offer
      const idx = remaining.findIndex(o =>
        o.societeContact.toLowerCase() === societe.toLowerCase()
      );

      if (idx === -1) {
        console.log(`  NOT FOUND: "${societe}" raw="${rawPax}"`);
        continue;
      }

      const match = remaining[idx];
      remaining.splice(idx, 1);

      const dbPax = match.nombrePax;
      const comments = commentsByOffer[match.id] || [];
      const hasRangeInComments = comments.some(c => c.includes(rawPax) || c.includes('pax'));

      console.log(`  "${societe}" raw="${rawPax}" max=${maxVal} db=${dbPax} rangeInComments=${hasRangeInComments}`);

      if (dbPax !== maxVal) {
        issues.push({
          id: match.id,
          societe,
          year,
          rawPax,
          maxVal,
          dbPax,
          hasRangeInComments,
        });
      }
      if (!hasRangeInComments) {
        issues.push({
          id: match.id,
          societe,
          year,
          rawPax,
          maxVal,
          dbPax,
          missingComment: true,
        });
      }
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log('ISSUES');
  console.log('='.repeat(60));

  const paxWrong = issues.filter(i => !i.missingComment && i.dbPax !== i.maxVal);
  const commentMissing = issues.filter(i => i.missingComment);

  console.log(`\nPax value incorrect (not max): ${paxWrong.length}`);
  for (const i of paxWrong) {
    console.log(`  [${i.year}] "${i.societe}": raw="${i.rawPax}" max=${i.maxVal} db=${i.dbPax}`);
  }

  console.log(`\nRange not in comments: ${commentMissing.length}`);
  for (const i of commentMissing) {
    console.log(`  [${i.year}] "${i.societe}": raw="${i.rawPax}" max=${i.maxVal} db=${i.dbPax}`);
  }
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
