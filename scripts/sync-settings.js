/**
 * sync-settings.js
 * Finds values used in offers that are missing from the settings table and inserts them.
 * Usage: NODE_PATH=client/node_modules node scripts/sync-settings.js
 */
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://ueqguwfdhulrhpltkapb.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVlcWd1d2ZkaHVscmhwbHRrYXBiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjIxNTk2NywiZXhwIjoyMDg3NzkxOTY3fQ.9V1HKqyApx65xYsx2EFfg-ETLu0jEpaq3DMIlXcqDEA';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Map offer column → setting type
const FIELD_MAP = {
  pays: 'pays',
  transmisPar: 'transmisPar',
  traitePar: 'traitePar',
  langue: 'langue',
  typeSociete: 'typeSociete',
  typeSejour: 'typeSejour',
  categorieHotel: 'categorieHotel',
  stationDemandee: 'stationDemandee',
  titreContact: 'titreContact',
  statut: 'statut',
};

async function main() {
  // 1. Fetch all existing settings
  const { data: allSettings, error: settingsErr } = await supabase
    .from('settings')
    .select('type, label');
  if (settingsErr) throw settingsErr;

  const existingByType = {};
  for (const s of allSettings) {
    if (!existingByType[s.type]) existingByType[s.type] = new Set();
    existingByType[s.type].add(s.label);
  }

  console.log('Current settings count by type:');
  for (const [type, labels] of Object.entries(existingByType)) {
    console.log(`  ${type}: ${labels.size} values`);
  }
  console.log('');

  // 2. For each field, get distinct values from offers
  const toInsert = [];

  for (const [column, settingType] of Object.entries(FIELD_MAP)) {
    const { data: rows, error: err } = await supabase
      .from('offers')
      .select(column)
      .not(column, 'is', null)
      .neq(column, '');

    if (err) {
      console.error(`Error querying ${column}:`, err.message);
      continue;
    }

    const distinctValues = new Set();
    for (const row of rows) {
      const val = row[column];
      if (val && val.trim()) {
        // categorieHotel and stationDemandee can have comma-separated values
        if (column === 'categorieHotel' || column === 'stationDemandee') {
          for (const part of val.split(',')) {
            const trimmed = part.trim();
            if (trimmed) distinctValues.add(trimmed);
          }
        } else {
          distinctValues.add(val.trim());
        }
      }
    }

    const existing = existingByType[settingType] || new Set();
    const missing = [...distinctValues].filter(v => !existing.has(v));

    if (missing.length > 0) {
      console.log(`${settingType}: ${missing.length} missing values:`);
      for (const v of missing.sort()) {
        console.log(`  + "${v}"`);
        toInsert.push({ type: settingType, label: v });
      }
    } else {
      console.log(`${settingType}: all values present`);
    }
  }

  console.log('');

  if (toInsert.length === 0) {
    console.log('Nothing to insert. All settings are up to date.');
    return;
  }

  console.log(`Inserting ${toInsert.length} missing settings...`);
  const { error: insertErr } = await supabase.from('settings').insert(toInsert);
  if (insertErr) throw insertErr;
  console.log('Done!');
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
