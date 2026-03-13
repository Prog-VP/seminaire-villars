/**
 * insert-offers.js
 * Inserts structured JSON data into Supabase DB
 * Usage: NODE_PATH=client/node_modules node scripts/insert-offers.js [2023|2024|2025|2026|all]
 *
 * Steps:
 * 1. Ensure required settings exist (statuts, transmisPar, traitePar, pays)
 * 2. Ensure hotels exist
 * 3. Insert offers + offer_hotel_sends + offer_comments
 */
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const SUPABASE_URL = 'https://ueqguwfdhulrhpltkapb.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVlcWd1d2ZkaHVscmhwbHRrYXBiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjIxNTk2NywiZXhwIjoyMDg3NzkxOTY3fQ.9V1HKqyApx65xYsx2EFfg-ETLu0jEpaq3DMIlXcqDEA';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// --- Normalization maps ---
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
  'YM - IG': 'YM',
  'GC, MP et SA': 'GC',
  'RC/GC': 'RC',
};

const LANGUE_MAP = {
  'BE': null, // Not a language
  'CH': null, // Not a language
};

// Settings to ensure exist
const REQUIRED_SETTINGS = [
  // Statuts
  { type: 'statut', label: 'En cours' },
  { type: 'statut', label: "Pas d'offre envoyée" },
  { type: 'statut', label: 'Annulé' },
  // transmisPar historiques
  { type: 'transmisPar', label: 'OT Villars' },
  { type: 'transmisPar', label: 'OT Diablerets' },
  { type: 'transmisPar', label: 'AV' },
  { type: 'transmisPar', label: 'Sergei' },
  { type: 'transmisPar', label: 'Villars X' },
  // traitePar historiques
  { type: 'traitePar', label: 'TR' },
  { type: 'traitePar', label: 'IG' },
  { type: 'traitePar', label: 'YM' },
  { type: 'traitePar', label: 'LK' },
  { type: 'traitePar', label: 'GH' },
  // Pays manquants
  { type: 'pays', label: 'IT' },
  { type: 'pays', label: 'NED' },
  { type: 'pays', label: 'NZ' },
  { type: 'pays', label: 'GR' },
  { type: 'pays', label: 'BT' },
  { type: 'pays', label: 'LU' },
  { type: 'pays', label: 'AT' },
  { type: 'pays', label: 'AE' },
  { type: 'pays', label: 'ES' },
  { type: 'pays', label: 'NO' },
  { type: 'pays', label: 'CN' },
];

// Hotels to create (with destinations)
const REQUIRED_HOTELS = [
  { nom: 'Royalp', destination: 'Villars' },
  { nom: 'Palace', destination: 'Villars' },
  { nom: 'Victoria', destination: 'Villars' },
  { nom: 'Alpe Fleurie', destination: 'Villars' },
  { nom: 'VIU', destination: 'Villars' },
  { nom: 'Ecureuil', destination: 'Villars' },
  { nom: 'Lavey', destination: 'Villars' },
  { nom: "Relai du Miroir d'Argentine", destination: 'Villars' },
  { nom: 'Miroir d\'Argentine & Refuge', destination: 'Villars' },
  { nom: 'Les Mazots du Clos', destination: 'Villars' },
  { nom: 'Villars Lodge', destination: 'Villars' },
  { nom: 'Eurotel', destination: 'Diablerets' },
  { nom: 'Sources', destination: 'Diablerets' },
  { nom: 'Poste', destination: 'Diablerets' },
  { nom: 'Lilas', destination: 'Diablerets' },
  { nom: 'Pillon', destination: 'Diablerets' },
  { nom: 'The Glacier Hotel', destination: 'Diablerets' },
];

async function ensureSettings() {
  const { data: existing } = await supabase.from('settings').select('type, label');
  const existingSet = new Set(existing.map(s => `${s.type}:${s.label}`));

  const toInsert = REQUIRED_SETTINGS.filter(s => !existingSet.has(`${s.type}:${s.label}`));
  if (toInsert.length > 0) {
    const { error } = await supabase.from('settings').insert(toInsert);
    if (error) throw new Error(`Settings insert error: ${error.message}`);
    console.log(`  ✓ ${toInsert.length} settings ajoutés: ${toInsert.map(s => `${s.type}:${s.label}`).join(', ')}`);
  } else {
    console.log('  ✓ Tous les settings existent déjà');
  }
}

async function ensureHotels() {
  const { data: existing } = await supabase.from('hotels').select('id, nom');
  const existingMap = new Map(existing.map(h => [h.nom, h.id]));

  const toInsert = REQUIRED_HOTELS.filter(h => !existingMap.has(h.nom));
  if (toInsert.length > 0) {
    const { data, error } = await supabase.from('hotels').insert(toInsert).select('id, nom');
    if (error) throw new Error(`Hotels insert error: ${error.message}`);
    data.forEach(h => existingMap.set(h.nom, h.id));
    console.log(`  ✓ ${toInsert.length} hôtels créés: ${toInsert.map(h => h.nom).join(', ')}`);
  } else {
    console.log('  ✓ Tous les hôtels existent déjà');
  }

  return existingMap;
}

function normalizeOffer(offer) {
  const o = { ...offer };

  // Normalize transmisPar
  if (o.transmisPar && TRANSMIS_PAR_MAP[o.transmisPar]) {
    o.transmisPar = TRANSMIS_PAR_MAP[o.transmisPar];
  }

  // Normalize traitePar
  if (o.traitePar && TRAITE_PAR_MAP[o.traitePar]) {
    o.traitePar = TRAITE_PAR_MAP[o.traitePar];
  }

  // Normalize langue
  if (o.langue && o.langue in LANGUE_MAP) {
    o.langue = LANGUE_MAP[o.langue];
  }

  // Clean email whitespace
  if (o.emailContact) {
    o.emailContact = o.emailContact.trim();
  }

  // Clean nom/prenom whitespace
  if (o.nomContact) o.nomContact = o.nomContact.trim();
  if (o.prenomContact) o.prenomContact = o.prenomContact.trim();
  if (o.traitePar) o.traitePar = o.traitePar.trim();

  return o;
}

// Hotel name normalization (different names across years for same hotel)
const HOTEL_NAME_MAP = {
  "Relai du Miroir d'Argentine": "Miroir d'Argentine & Refuge",
};

async function insertYear(year, hotelMap) {
  const filePath = `Historique/${year}_structured.json`;
  if (!fs.existsSync(filePath)) {
    console.log(`  ⚠ Fichier ${filePath} non trouvé`);
    return;
  }

  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  console.log(`\n📄 ${year}: ${data.totalRows} offres à insérer`);

  let inserted = 0;
  let errors = 0;

  for (const entry of data.offers) {
    const offer = normalizeOffer(entry.offer);

    // Remove fields not in DB schema
    delete offer.relanceEffectueeLe; // Only set if we have a real date
    const relanceDate = entry.offer.relanceEffectueeLe;

    // Build the offer record
    const offerRecord = {
      societeContact: offer.societeContact,
      typeSociete: offer.typeSociete || '',
      pays: offer.pays || '',
      emailContact: offer.emailContact,
      langue: offer.langue,
      titreContact: offer.titreContact,
      nomContact: offer.nomContact,
      prenomContact: offer.prenomContact,
      nombreDeNuits: offer.nombreDeNuits,
      nombrePax: offer.nombrePax,
      transmisPar: offer.transmisPar,
      typeSejour: offer.typeSejour,
      categorieHotel: offer.categorieHotel,
      categorieHotelAutre: offer.categorieHotelAutre,
      stationDemandee: offer.stationDemandee,
      traitePar: offer.traitePar,
      dateEnvoiOffre: offer.dateEnvoiOffre,
      dateOptions: offer.dateOptions || [],
      statut: offer.statut,
      reservationEffectuee: offer.reservationEffectuee || false,
      contactEntreDansBrevo: offer.contactEntreDansBrevo || false,
      retourEffectueHotels: offer.retourEffectueHotels || false,
      activiteUniquement: offer.activiteUniquement || false,
      seminaire: offer.seminaire || false,
    };

    if (relanceDate) {
      offerRecord.relanceEffectueeLe = relanceDate;
    }

    // Insert offer
    const { data: insertedOffer, error: offerError } = await supabase
      .from('offers')
      .insert(offerRecord)
      .select('id')
      .single();

    if (offerError) {
      console.error(`  ✗ Row ${entry.rowIndex} (${offer.societeContact}): ${offerError.message}`);
      errors++;
      continue;
    }

    const offerId = insertedOffer.id;

    // Insert hotel sends
    if (entry.hotelSends && entry.hotelSends.length > 0) {
      const hotelSendRecords = [];
      for (const hotelName of entry.hotelSends) {
        // Normalize hotel name
        const normalizedName = HOTEL_NAME_MAP[hotelName] || hotelName;
        const hotelId = hotelMap.get(normalizedName) || hotelMap.get(hotelName);
        if (hotelId) {
          hotelSendRecords.push({ offer_id: offerId, hotel_id: hotelId });
        } else {
          console.warn(`  ⚠ Hôtel "${hotelName}" non trouvé pour offre ${offer.societeContact}`);
        }
      }
      if (hotelSendRecords.length > 0) {
        const { error: sendError } = await supabase.from('offer_hotel_sends').insert(hotelSendRecords);
        if (sendError) console.error(`  ⚠ Hotel sends error: ${sendError.message}`);
      }
    }

    // Insert notes as comment
    if (entry.notes) {
      const { error: commentError } = await supabase.from('offer_comments').insert({
        offer_id: offerId,
        author: 'Import historique',
        content: entry.notes,
        date: offer.dateEnvoiOffre || `${year}-01-01`,
      });
      if (commentError) console.error(`  ⚠ Comment error: ${commentError.message}`);
    }

    // Insert raw dates as comment if any
    if (entry.rawDates && entry.rawDates.length > 0) {
      const { error: dateCommentError } = await supabase.from('offer_comments').insert({
        offer_id: offerId,
        author: 'Import historique',
        content: `Dates séjour (brut): ${entry.rawDates.join(', ')}`,
        date: offer.dateEnvoiOffre || `${year}-01-01`,
      });
      if (dateCommentError) console.error(`  ⚠ Date comment error: ${dateCommentError.message}`);
    }

    inserted++;
  }

  console.log(`  ✓ ${inserted} offres insérées, ${errors} erreurs`);
}

async function main() {
  const arg = process.argv[2] || 'all';
  const years = arg === 'all' ? ['2023', '2024', '2025', '2026'] : [arg];

  console.log('🔧 Pré-requis DB...');
  await ensureSettings();
  const hotelMap = await ensureHotels();

  for (const year of years) {
    await insertYear(year, hotelMap);
  }

  console.log('\n✅ Import terminé');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
