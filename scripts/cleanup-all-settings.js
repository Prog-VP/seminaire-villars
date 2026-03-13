/**
 * cleanup-all-settings.js
 * Fix all duplicate/inconsistent values in offers and settings
 */
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://ueqguwfdhulrhpltkapb.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVlcWd1d2ZkaHVscmhwbHRrYXBiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjIxNTk2NywiZXhwIjoyMDg3NzkxOTY3fQ.9V1HKqyApx65xYsx2EFfg-ETLu0jEpaq3DMIlXcqDEA';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function fixOfferField(field, badValue, goodValue) {
  const { data, error } = await supabase
    .from('offers')
    .update({ [field]: goodValue })
    .eq(field, badValue)
    .select('id');
  if (error) throw error;
  console.log(`  offers.${field}: "${badValue}" → "${goodValue}": ${data.length} rows`);
  return data.length;
}

async function deleteSetting(type, label) {
  const { error } = await supabase
    .from('settings')
    .delete()
    .eq('type', type)
    .eq('label', label);
  if (error) throw error;
  console.log(`  deleted setting: ${type} = "${label.replace(/[\r\n]/g, '\\n')}"`);
}

async function main() {
  // 1. Fix pays duplicates in offers
  console.log('=== Fixing pays duplicates ===');
  await fixOfferField('pays', 'CAN', 'CA');
  await fixOfferField('pays', 'NED', 'NL');
  // UAE → AE (standard ISO)
  await fixOfferField('pays', 'UAE', 'AE');
  // UK → GB (standard ISO)
  await fixOfferField('pays', 'UK', 'GB');

  // 2. Fix titreContact: find all variants of "M\nMme" or "M\r\nMme"
  console.log('\n=== Fixing titreContact ===');
  // Query all offers with titreContact containing M and Mme
  const { data: badTitres } = await supabase
    .from('offers')
    .select('id, titreContact')
    .like('titreContact', '%M%Mme%');

  if (badTitres && badTitres.length > 0) {
    for (const row of badTitres) {
      if (row.titreContact !== 'M.' && row.titreContact !== 'Mme') {
        await supabase.from('offers').update({ titreContact: 'M.' }).eq('id', row.id);
      }
    }
    console.log(`  Fixed ${badTitres.length} offers with bad titreContact`);
  } else {
    console.log('  No bad titreContact found');
  }

  // 3. Remove duplicate/bad settings
  console.log('\n=== Removing bad settings ===');
  const badSettings = [
    { type: 'pays', label: 'CAN' },
    { type: 'pays', label: 'NED' },
    { type: 'pays', label: 'UAE' },
    { type: 'pays', label: 'UK' },
    { type: 'pays', label: 'BT' },   // Not a real country code used
    { type: 'pays', label: 'AE' },   // Duplicate of UAE → AE already exists... wait let me check
  ];

  // First check what pays settings exist
  const { data: paysSettings } = await supabase
    .from('settings')
    .select('id, label')
    .eq('type', 'pays')
    .order('label');
  console.log('\n  Current pays settings:', paysSettings.map(s => s.label).join(', '));

  // Check which pays are actually used in offers now
  const { data: paysUsed } = await supabase.from('offers').select('pays');
  const usedPays = new Set();
  for (const row of paysUsed) {
    if (row.pays && row.pays.trim()) usedPays.add(row.pays.trim());
  }
  console.log('  Pays used in offers:', [...usedPays].sort().join(', '));

  // Delete pays settings that are NOT used and are duplicates
  const dupeLabels = ['CAN', 'NED', 'UAE', 'UK'];
  for (const label of dupeLabels) {
    const exists = paysSettings.find(s => s.label === label);
    if (exists) {
      await deleteSetting('pays', label);
    }
  }

  // Ensure GB exists (we renamed UK → GB)
  const hasGB = paysSettings.find(s => s.label === 'GB');
  if (!hasGB) {
    const { error } = await supabase.from('settings').insert({ type: 'pays', label: 'GB' });
    if (error) throw error;
    console.log('  Added setting: pays = "GB"');
  }

  // Delete titreContact bad entries
  const { data: titreSettings } = await supabase
    .from('settings')
    .select('id, label')
    .eq('type', 'titreContact');

  for (const s of titreSettings) {
    if (s.label !== 'M.' && s.label !== 'Mme') {
      await supabase.from('settings').delete().eq('id', s.id);
      console.log(`  Deleted titreContact setting id=${s.id}: "${s.label.replace(/[\r\n]/g, '\\n')}"`);
    }
  }

  // Final state
  console.log('\n=== Final settings state ===');
  const { data: allSettings } = await supabase
    .from('settings')
    .select('type, label')
    .order('type')
    .order('label');
  const byType = {};
  for (const s of allSettings) {
    if (!byType[s.type]) byType[s.type] = [];
    byType[s.type].push(s.label);
  }
  for (const [type, labels] of Object.entries(byType)) {
    console.log(`${type}: ${labels.join(', ')}`);
  }
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
