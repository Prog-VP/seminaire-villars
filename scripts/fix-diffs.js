/**
 * fix-diffs.js
 * Fix all differences found between source files and DB export
 */
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://ueqguwfdhulrhpltkapb.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVlcWd1d2ZkaHVscmhwbHRrYXBiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjIxNTk2NywiZXhwIjoyMDg3NzkxOTY3fQ.9V1HKqyApx65xYsx2EFfg-ETLu0jEpaq3DMIlXcqDEA';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function main() {
  // 1. Fix double spaces in stationDemandee
  console.log('=== Fix stationDemandee double spaces ===');
  const { data: stationRows, error: stationErr } = await supabase
    .from('offers')
    .select('id, stationDemandee')
    .like('stationDemandee', '%  %');
  if (stationErr) throw stationErr;

  for (const row of stationRows) {
    const fixed = row.stationDemandee.replace(/  +/g, ' ');
    await supabase.from('offers').update({ stationDemandee: fixed }).eq('id', row.id);
  }
  console.log(`  Fixed ${stationRows.length} offers`);

  // 2. Fix double spaces in categorieHotel
  console.log('\n=== Fix categorieHotel double spaces ===');
  const { data: catRows, error: catErr } = await supabase
    .from('offers')
    .select('id, categorieHotel')
    .like('categorieHotel', '%  %');
  if (catErr) throw catErr;

  for (const row of catRows) {
    const fixed = row.categorieHotel.replace(/  +/g, ' ');
    await supabase.from('offers').update({ categorieHotel: fixed }).eq('id', row.id);
  }
  console.log(`  Fixed ${catRows.length} offers`);

  // 3. Fix langue: empty → Français for offers that should have it
  console.log('\n=== Fix empty langue → Français ===');
  const { data: langueRows, error: langueErr } = await supabase
    .from('offers')
    .select('id, langue, societeContact')
    .or('langue.is.null,langue.eq.');
  if (langueErr) throw langueErr;

  let langueFixed = 0;
  for (const row of langueRows) {
    await supabase.from('offers').update({ langue: 'Français' }).eq('id', row.id);
    console.log(`  "${row.societeContact}" → Français`);
    langueFixed++;
  }
  console.log(`  Fixed ${langueFixed} offers`);

  // 4. Fix hotel: merge "Relai du Miroir d'Argentine" into "Miroir d'Argentine & Refuge"
  console.log('\n=== Fix hotel: Relai du Miroir → Miroir d\'Argentine & Refuge ===');

  // Find the two hotels
  const { data: hotels } = await supabase
    .from('hotels')
    .select('id, nom')
    .or("nom.ilike.%Relai%Miroir%,nom.ilike.%Miroir%Argentine%");

  console.log('  Found hotels:', hotels.map(h => `${h.nom} (${h.id})`).join(', '));

  const relaiHotel = hotels.find(h => h.nom.includes('Relai'));
  const miroirHotel = hotels.find(h => h.nom.includes('Miroir') && !h.nom.includes('Relai'));

  if (relaiHotel && miroirHotel) {
    // Update all offer_hotel_sends that point to relai → miroir
    const { data: sends } = await supabase
      .from('offer_hotel_sends')
      .select('id, offer_id')
      .eq('hotel_id', relaiHotel.id);

    console.log(`  Found ${sends.length} sends referencing "${relaiHotel.nom}"`);

    for (const send of sends) {
      // Check if this offer already has a send to miroirHotel
      const { data: existing } = await supabase
        .from('offer_hotel_sends')
        .select('id')
        .eq('offer_id', send.offer_id)
        .eq('hotel_id', miroirHotel.id);

      if (existing && existing.length > 0) {
        // Already has miroir, just delete the relai send
        await supabase.from('offer_hotel_sends').delete().eq('id', send.id);
        console.log(`  Offer ${send.offer_id}: deleted duplicate relai send`);
      } else {
        // Update to point to miroir
        await supabase.from('offer_hotel_sends').update({ hotel_id: miroirHotel.id }).eq('id', send.id);
        console.log(`  Offer ${send.offer_id}: relai → miroir`);
      }
    }

    // Delete the relai hotel
    await supabase.from('hotels').delete().eq('id', relaiHotel.id);
    console.log(`  Deleted hotel "${relaiHotel.nom}"`);
  } else {
    console.log('  Could not find both hotels, skipping');
  }

  console.log('\nDone!');
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
