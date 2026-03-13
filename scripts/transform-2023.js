/**
 * transform-2023.js
 * Transforms raw 2023 Excel data into structured JSON for DB import
 * Usage: NODE_PATH=client/node_modules node scripts/transform-2023.js
 */
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const workbook = XLSX.readFile(path.resolve('Historique/Etat des offres et statistiques 2023.xlsx'));
const sheet = workbook.Sheets['2023'];
const range = XLSX.utils.decode_range(sheet['!ref']);

// Read all cells raw
const allRows = [];
for (let r = range.s.r; r <= range.e.r; r++) {
  const row = [];
  for (let c = range.s.c; c <= Math.min(range.e.c, 50); c++) {
    const addr = XLSX.utils.encode_cell({ r, c });
    const cell = sheet[addr];
    row.push(cell ? cell.v : null);
  }
  allRows.push(row);
}

// Row 0-1 = headers, Row 2+ = data (first data row is Belletane)
const dataRows = allRows.slice(2);

// Hotel column mapping (cols 30-44)
const hotelColumns = [
  { col: 30, name: 'Royalp' },
  { col: 31, name: 'Palace' },
  { col: 32, name: 'Victoria' },
  { col: 33, name: 'Alpe Fleurie' },
  { col: 34, name: 'VIU' },
  { col: 35, name: 'Ecureuil' },
  { col: 36, name: 'Lavey' },
  { col: 37, name: 'Relai du Miroir d\'Argentine' },
  { col: 38, name: 'Les Mazots du Clos' },
  { col: 39, name: 'Villars Lodge' },
  { col: 40, name: 'Eurotel' },
  { col: 41, name: 'Sources' },
  { col: 42, name: 'Poste' },
  { col: 43, name: 'Lilas' },
  { col: 44, name: 'Pillon' },
];

const MONTHS = {
  'janvier': '01', 'février': '02', 'mars': '03', 'avril': '04',
  'mai': '05', 'juin': '06', 'juillet': '07', 'août': '08',
  'septembre': '09', 'octobre': '10', 'novembre': '11', 'décembre': '12',
  'january': '01', 'february': '02', 'march': '03', 'april': '04',
  'may': '05', 'june': '06', 'july': '07', 'august': '08',
  'september': '09', 'october': '10', 'november': '11', 'december': '12',
};

function parseMonth(m) {
  if (!m) return null;
  return MONTHS[String(m).toLowerCase().trim()] || null;
}

function buildDateEnvoiOffre(jour, mois) {
  const m = parseMonth(mois);
  if (!m || !jour) return null;
  const d = String(jour).padStart(2, '0');
  return `2023-${m}-${d}`;
}

function buildDateOptions(joursStr, moisStr, anneeStr) {
  if (!joursStr && !moisStr) return [];
  const annee = anneeStr ? String(anneeStr).trim() : '2023';
  if (annee === '?') return [];

  const moisRaw = String(moisStr || '').trim();
  const jours = String(joursStr || '').trim();

  // Handle multi-month like "juin/septembre/octobre" or "janvier/février" or "septembre/ octobre"
  const moisParts = moisRaw.split(/\s*[/,]\s*/);
  if (moisParts.length > 1) {
    // Check for cross-month range: "28-2 janvier/février" or "entre 15-5 septembre/ octobre"
    const jourClean = jours.replace(/^entre\s+/i, '');
    const crossMatch = jourClean.match(/^(\d{1,2})\s*[-–]\s*(\d{1,2})$/);
    if (crossMatch && moisParts.length === 2) {
      const m1 = parseMonth(moisParts[0]);
      const m2 = parseMonth(moisParts[1]);
      if (m1 && m2) {
        const yr2 = m2 < m1 ? String(parseInt(annee) + 1) : annee;
        return [{
          du: `${annee}-${m1}-${String(crossMatch[1]).padStart(2, '0')}`,
          au: `${yr2}-${m2}-${String(crossMatch[2]).padStart(2, '0')}`,
        }];
      }
    }
    // "11-14 ou 8-10" with multi months
    const ouMatch = jours.match(/^(\d{1,2})\s*[-–]\s*(\d{1,2})\s+ou\s+(\d{1,2})\s*[-–]\s*(\d{1,2})$/i);
    if (ouMatch && moisParts.length === 2) {
      const m1 = parseMonth(moisParts[0]);
      const m2 = parseMonth(moisParts[1]);
      if (m1 && m2) {
        return [
          { du: `${annee}-${m1}-${String(ouMatch[1]).padStart(2, '0')}`, au: `${annee}-${m1}-${String(ouMatch[2]).padStart(2, '0')}` },
          { du: `${annee}-${m2}-${String(ouMatch[3]).padStart(2, '0')}`, au: `${annee}-${m2}-${String(ouMatch[4]).padStart(2, '0')}` },
        ];
      }
    }
    // Multiple separate months: store as raw
    return [{ raw: `${jours} ${moisRaw} ${annee}`.trim() }];
  }

  const m = parseMonth(moisRaw);

  if (!m) {
    // Free text like "été" -> store as raw
    return [{ raw: `${jours} ${moisRaw} ${annee}`.trim() }];
  }

  // Handle "entre 15-5" or "entre 15-9" -> range-ish
  const entreMatch = jours.match(/^entre\s+(\d{1,2})\s*[-–]\s*(\d{1,2})$/i);
  if (entreMatch) {
    return [{
      du: `${annee}-${m}-${String(entreMatch[1]).padStart(2, '0')}`,
      au: `${annee}-${m}-${String(entreMatch[2]).padStart(2, '0')}`,
      approx: true,
    }];
  }

  // Handle "11-14 ou 8-10" -> two options
  const ouMatch = jours.match(/^(\d{1,2})\s*[-–]\s*(\d{1,2})\s+ou\s+(\d{1,2})\s*[-–]\s*(\d{1,2})$/i);
  if (ouMatch) {
    return [
      { du: `${annee}-${m}-${String(ouMatch[1]).padStart(2, '0')}`, au: `${annee}-${m}-${String(ouMatch[2]).padStart(2, '0')}` },
      { du: `${annee}-${m}-${String(ouMatch[3]).padStart(2, '0')}`, au: `${annee}-${m}-${String(ouMatch[4]).padStart(2, '0')}` },
    ];
  }

  // Parse day range
  const dayMatch = jours.match(/^(\d{1,2})\s*[-–]\s*(\d{1,2})$/);
  if (dayMatch) {
    const du = `${annee}-${m}-${String(dayMatch[1]).padStart(2, '0')}`;
    const au = `${annee}-${m}-${String(dayMatch[2]).padStart(2, '0')}`;
    return [{ du, au }];
  }

  // Single day
  const singleDay = jours.match(/^(\d{1,2})$/);
  if (singleDay) {
    const du = `${annee}-${m}-${String(singleDay[1]).padStart(2, '0')}`;
    return [{ du, au: du }];
  }

  // Excel serial date number
  if (/^\d{5}$/.test(jours)) {
    // Excel serial -> JS date
    const excelEpoch = new Date(1899, 11, 30);
    const jsDate = new Date(excelEpoch.getTime() + parseInt(jours) * 86400000);
    const du = jsDate.toISOString().slice(0, 10);
    return [{ du, au: du }];
  }

  // Fallback: store raw
  return [{ raw: `${jours} ${moisRaw} ${annee}`.trim() }];
}

function parseTypeSociete(agence, entreprise) {
  if (agence === 1 || agence === 'x' || agence === 'X') return 'Agence';
  if (entreprise === 1 || entreprise === 'x' || entreprise === 'X') return 'Entreprise';
  return '';
}

function parseTypeSejour(groupe, seminaire) {
  const types = [];
  if (groupe === 1 || groupe === 'x') types.push('Groupe loisirs');
  if (seminaire === 1 || seminaire === 'x') types.push('Séminaire');
  return types.join(', ') || null;
}

function parseSeminaire(seminaire) {
  return seminaire === 1 || seminaire === 'x' || seminaire === 'X';
}

function parseStation(villars, diablerets) {
  const stations = [];
  if (villars === 1 || villars === 'x') stations.push('Villars');
  if (diablerets === 1 || diablerets === 'x') stations.push('Diablerets');
  return stations.join(', ') || null;
}

function parseOuiNon(val) {
  if (val === null || val === undefined) return false;
  const s = String(val).toLowerCase().trim();
  if (s === 'oui' || s === '1' || s === 'x') return true;
  if (s.startsWith('oui')) return true; // "Oui/activity only"
  return false;
}

function parseStatut(reservationVal, remarques, feedback) {
  const r = String(reservationVal || '').toLowerCase().trim();
  if (r === 'oui') return 'Confirmé';
  if (r === 'oui/activity only') return 'Confirmé';
  if (r === 'non') return 'Refusé';
  if (r === 'no rep') return 'En cours';
  if (r === "pas d'offre") return "Pas d'offre envoyée";
  if (r === '' || r === 'null') return 'En cours';
  // Annulé would need explicit mention
  if (r.includes('annul')) return 'Annulé';
  return 'En cours';
}

function parseLang(val) {
  if (!val) return null;
  const l = String(val).toUpperCase().trim();
  if (l === 'FR') return 'Français';
  if (l === 'EN') return 'Anglais';
  if (l === 'DE') return 'Allemand';
  if (l === 'IT') return 'Italien';
  return val;
}

function parseHotelSends(row) {
  return hotelColumns
    .filter(h => row[h.col] === 1 || row[h.col] === 'x' || row[h.col] === 'X')
    .map(h => h.name);
}

function buildNotes(remarques, feedback, activites, datesBrut, moisBrut) {
  const parts = [];
  if (remarques) parts.push(`Remarques: ${remarques}`);
  if (feedback) parts.push(`Feedback: ${feedback}`);
  // Include raw date info if dates couldn't be fully parsed
  return parts.join(' | ') || null;
}

const results = [];
const issues = [];

for (let i = 0; i < dataRows.length; i++) {
  const row = dataRows[i];

  // Skip empty rows
  if (!row[0]) continue;

  const societe = String(row[0]).trim();

  // Skip summary/total rows at bottom (they have statut names as société)
  const summaryLabels = ["pas d'offre d'hébergements", 'annulé', 'confirmé', 'en cours', 'sans réponse', 'total', 'refusé'];
  if (summaryLabels.includes(societe.toLowerCase())) continue;
  const dateEnvoiOffre = buildDateEnvoiOffre(row[1], row[2]);
  const typeSociete = parseTypeSociete(row[3], row[4]);
  const pays = row[5] ? String(row[5]).trim() : '';
  const email = row[6] ? String(row[6]).trim() : null;
  const langue = parseLang(row[7]);
  const titre = row[8] ? String(row[8]).trim() : null;
  const nom = row[9] ? String(row[9]).trim() : null;
  const prenom = row[10] ? String(row[10]).trim() : null;
  const dateOptions = buildDateOptions(row[11], row[12], row[13]);
  const activiteUniquement = parseOuiNon(row[14]);
  const nuits = row[15] !== null && row[15] !== undefined ? String(row[15]) : null;
  const pax = row[16] !== null ? (typeof row[16] === 'number' ? row[16] : null) : null;
  const paxStr = row[16] !== null ? String(row[16]) : null;
  const transmisPar = row[17] ? String(row[17]).trim() : null;
  const typeSejour = parseTypeSejour(row[18], row[19]);
  const seminaire = parseSeminaire(row[19]);
  const categorieHotel = row[20] ? String(row[20]).trim() : null;
  const stationDemandee = parseStation(row[21], row[22]);
  const remarques = row[23] ? String(row[23]).trim() : null;
  const relance = parseOuiNon(row[24]);
  const retourHotels = parseOuiNon(row[25]);
  const reservationVal = row[26];
  const contactBrevo = parseOuiNon(row[27]);
  const feedback = row[28] ? String(row[28]).trim() : null;
  const traitePar = row[29] ? String(row[29]).trim() : null;
  const statut = parseStatut(reservationVal, remarques, feedback);
  const hotelSends = parseHotelSends(row);
  const notes = buildNotes(remarques, feedback, row[14], row[11], row[12]);

  // Track ambiguous cases
  const rowIssues = [];
  if (!dateEnvoiOffre) rowIssues.push('Date envoi offre non parsée');
  if (dateOptions.length > 0 && dateOptions[0].raw) rowIssues.push(`Dates séjour brut: ${dateOptions[0].raw}`);
  if (paxStr && isNaN(parseInt(paxStr))) rowIssues.push(`Pax non numérique: ${paxStr}`);
  if (nuits && isNaN(parseInt(nuits))) rowIssues.push(`Nuits non numérique: ${nuits}`);

  // Categorize hotel: standard stars vs free text
  let catHotelStd = null;
  let catHotelAutre = null;
  if (categorieHotel) {
    const starMatch = categorieHotel.match(/(\d\*)/g);
    if (starMatch) {
      catHotelStd = starMatch.join(',');
      const remainder = categorieHotel.replace(/\d\*/g, '').replace(/[,\s]+ou\s+/gi, '').replace(/[,\s]+év\.\s*/gi, '').trim();
      if (remainder) catHotelAutre = remainder;
    } else {
      catHotelAutre = categorieHotel;
    }
  }

  const entry = {
    rowIndex: i + 3, // Excel row number (1-based, after 2 header rows)
    offer: {
      societeContact: societe,
      typeSociete,
      pays,
      emailContact: email,
      langue,
      titreContact: titre,
      nomContact: nom,
      prenomContact: prenom,
      nombreDeNuits: nuits,
      nombrePax: typeof pax === 'number' ? pax : null,
      transmisPar,
      typeSejour,
      categorieHotel: catHotelStd,
      categorieHotelAutre: catHotelAutre,
      stationDemandee,
      traitePar,
      dateEnvoiOffre,
      dateOptions: dateOptions.filter(d => !d.raw), // Only structured dates
      statut,
      reservationEffectuee: parseOuiNon(reservationVal),
      contactEntreDansBrevo: contactBrevo,
      retourEffectueHotels: retourHotels,
      activiteUniquement,
      seminaire,
    },
    hotelSends,
    notes,
  };

  if (rowIssues.length > 0) {
    entry.issues = rowIssues;
    issues.push({ row: i + 3, societe, issues: rowIssues });
  }

  results.push(entry);
}

// Output
const output = {
  file: '2023',
  totalRows: results.length,
  issueCount: issues.length,
  issues,
  offers: results,
};

fs.writeFileSync('Historique/2023_structured.json', JSON.stringify(output, null, 2));
console.log(`✓ ${results.length} offres extraites, ${issues.length} avec problèmes`);
console.log('\nCas avec problèmes:');
issues.forEach(iss => {
  console.log(`  Row ${iss.row} (${iss.societe}): ${iss.issues.join(', ')}`);
});

// Summary stats
const statuts = {};
results.forEach(r => {
  const s = r.offer.statut;
  statuts[s] = (statuts[s] || 0) + 1;
});
console.log('\nStatuts:');
Object.entries(statuts).forEach(([k, v]) => console.log(`  ${k}: ${v}`));

const allHotels = new Set();
results.forEach(r => r.hotelSends.forEach(h => allHotels.add(h)));
console.log('\nHôtels référencés:', [...allHotels].join(', '));

const transmisParSet = new Set();
results.forEach(r => { if (r.offer.transmisPar) transmisParSet.add(r.offer.transmisPar); });
console.log('Transmis par:', [...transmisParSet].join(', '));

const traiteParSet = new Set();
results.forEach(r => { if (r.offer.traitePar) traiteParSet.add(r.offer.traitePar); });
console.log('Traité par:', [...traiteParSet].join(', '));
