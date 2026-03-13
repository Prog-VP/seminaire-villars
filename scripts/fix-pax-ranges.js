/**
 * fix-pax-ranges.js
 * Fix AMEX pax value and add range comments for all 18 offers
 */
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://ueqguwfdhulrhpltkapb.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVlcWd1d2ZkaHVscmhwbHRrYXBiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjIxNTk2NywiZXhwIjoyMDg3NzkxOTY3fQ.9V1HKqyApx65xYsx2EFfg-ETLu0jEpaq3DMIlXcqDEA';
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const RANGES = [
  { societe: "Artabana Suisse", raw: "25-35" },
  { societe: "Quantis", raw: "80-100" },
  { societe: "Villars X", raw: "50-80 pax" },
  { societe: "Purecommsgroup", raw: "35-40 pax" },
  { societe: "Steel Construction", raw: "16-20" },
  { societe: "Omnia Travel", raw: "50-100" },
  { societe: "Loyens & Loeff", raw: "110-115" },
  { societe: "Procter & Gamble/ CWT", raw: "200-380" },
  { societe: "ITL World", raw: "30-40" },
  { societe: "High 5 Events", raw: "110-150" },
  { societe: "AMEX GBT Small meetings", raw: "60, max 70", fixPax: 70 },
  { societe: "Image de Soi(e)", raw: "3-5" },
  { societe: "Bird&Bird", raw: "45-50" },
  { societe: "Flyability SA", raw: "120-150" },
  { societe: "At Home Events", raw: "16-20" },
  { societe: "INVENTEC PERFORMANCE CHEMICALS SA", raw: "50-60" },
  { societe: "ILO International Labour Organization", raw: "35-40" },
  { societe: "FCM Travel", raw: "50-100" },
];

async function main() {
  for (const item of RANGES) {
    // Find offer
    const { data: offers } = await supabase
      .from('offers')
      .select('id')
      .eq('societeContact', item.societe);

    if (!offers || offers.length === 0) {
      console.log(`NOT FOUND: "${item.societe}"`);
      continue;
    }

    const offerId = offers[0].id;

    // Fix pax if needed
    if (item.fixPax) {
      await supabase.from('offers').update({ nombrePax: item.fixPax }).eq('id', offerId);
      console.log(`Fixed pax: "${item.societe}" → ${item.fixPax}`);
    }

    // Check if comment already exists
    const { data: comments } = await supabase
      .from('offer_comments')
      .select('id, content')
      .eq('offer_id', offerId);

    const hasRange = (comments || []).some(c =>
      c.content.includes('Nombre de participants') || c.content.includes(item.raw)
    );

    if (!hasRange) {
      await supabase.from('offer_comments').insert({
        offer_id: offerId,
        author: 'Import',
        content: `Nombre de participants (range Excel) : ${item.raw}`,
      });
      console.log(`Added range comment: "${item.societe}" → "${item.raw}"`);
    } else {
      console.log(`Already has range comment: "${item.societe}"`);
    }
  }

  console.log('\nDone!');
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
