/**
 * cleanup-settings.js
 * Fix duplicated/malformed values in offers and remove bad settings entries.
 */
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://ueqguwfdhulrhpltkapb.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVlcWd1d2ZkaHVscmhwbHRrYXBiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjIxNTk2NywiZXhwIjoyMDg3NzkxOTY3fQ.9V1HKqyApx65xYsx2EFfg-ETLu0jEpaq3DMIlXcqDEA';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function main() {
  // 1. Fix pays: LUX → LU, SWE → SE
  const paysFixes = { 'LUX': 'LU', 'SWE': 'SE' };
  for (const [bad, good] of Object.entries(paysFixes)) {
    const { data, error } = await supabase
      .from('offers')
      .update({ pays: good })
      .eq('pays', bad)
      .select('id');
    if (error) throw error;
    console.log(`pays: "${bad}" → "${good}": ${data.length} offers updated`);
  }

  // 2. Fix titreContact: "M" → "M.", "M\nMme" → "M."
  const titreFixes = { 'M': 'M.', 'M\nMme': 'M.' };
  for (const [bad, good] of Object.entries(titreFixes)) {
    const { data, error } = await supabase
      .from('offers')
      .update({ titreContact: good })
      .eq('titreContact', bad)
      .select('id');
    if (error) throw error;
    console.log(`titreContact: "${bad.replace(/\n/g, '\\n')}" → "${good}": ${data.length} offers updated`);
  }

  // 3. Remove the bad settings entries
  const badSettings = [
    { type: 'pays', label: 'LUX' },
    { type: 'pays', label: 'SWE' },
    { type: 'titreContact', label: 'M' },
    { type: 'titreContact', label: 'M\nMme' },
  ];
  for (const { type, label } of badSettings) {
    const { error } = await supabase
      .from('settings')
      .delete()
      .eq('type', type)
      .eq('label', label);
    if (error) throw error;
    console.log(`Deleted setting: ${type} = "${label.replace(/\n/g, '\\n')}"`);
  }

  console.log('\nDone! Cleanup complete.');
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
