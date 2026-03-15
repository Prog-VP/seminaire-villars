/**
 * transform-excel.js
 * Transforms any year's Excel file into structured JSON for DB import
 * Usage: NODE_PATH=client/node_modules node scripts/transform-excel.js <year>
 *   year: 2023, 2024, 2025, or 2026
 */
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const year = process.argv[2];
if (!year || !['2023', '2024', '2025', '2026'].includes(year)) {
  console.error('Usage: node scripts/transform-excel.js <2023|2024|2025|2026>');
  process.exit(1);
}

const files = {
  '2023': 'Historique/Etat des offres et statistiques 2023.xlsx',
  '2024': 'Historique/Etat des offres et statistiques 2024_new.xlsx',
  '2025': 'Historique/Etat des offres et statistiques 2025.xlsx',
  '2026': 'Historique/Etat des offres et statistiques 2026.xlsx',
};

const workbook = XLSX.readFile(path.resolve(files[year]));
const sheet = workbook.Sheets[year];
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

// Row 0-1 = headers, Row 2+ = data
// Read hotel names from header row 1 (cols 30-44)
const headerRow1 = allRows[1];
const hotelColumns = [];
for (let c = 30; c <= 44; c++) {
  const name = headerRow1[c];
  if (name) {
    hotelColumns.push({ col: c, name: name.replace(/\r\n/g, ' ').trim() });
  }
}

const dataRows = allRows.slice(2);

// --- Helpers ---

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
  let d = Math.round(Number(jour));
  if (isNaN(d)) return null;
  // Clamp to last day of month (handles "31 juin" etc.)
  const maxDay = new Date(parseInt(year), parseInt(m), 0).getDate();
  if (d > maxDay) d = maxDay;
  return `${year}-${m}-${String(d).padStart(2, '0')}`;
}

function lastDayOfMonth(year, month) {
  return new Date(parseInt(year), parseInt(month), 0).getDate();
}

function makeApproxMonth(annee, monthNum) {
  const last = lastDayOfMonth(annee, monthNum);
  return {
    du: `${annee}-${monthNum}-01`,
    au: `${annee}-${monthNum}-${String(last).padStart(2, '0')}`,
    approximatif: true,
  };
}

function buildDateOptions(joursStr, moisStr, anneeStr) {
  if (!joursStr && !moisStr) return [];
  const annee = anneeStr ? String(anneeStr).trim() : year;
  if (annee === '?') return [];

  const moisRaw = String(moisStr || '').trim();
  const jours = String(joursStr || '').trim();

  // Handle multi-month like "juin/septembre/octobre" or "janvier/février"
  const moisParts = moisRaw.split(/\s*[/,\r\n]+\s*/).filter(Boolean);
  if (moisParts.length > 1) {
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
    // "du 17 ou du 24" with two months
    const duOuDu = jours.match(/du\s+(\d{1,2})\s+ou\s+du\s+(\d{1,2})/i);
    if (duOuDu && moisParts.length === 2) {
      const m1 = parseMonth(moisParts[0]);
      const m2 = parseMonth(moisParts[1]);
      if (m1 && m2) {
        return [
          { du: `${annee}-${m1}-${String(duOuDu[1]).padStart(2, '0')}`, au: `${annee}-${m1}-${String(duOuDu[1]).padStart(2, '0')}` },
          { du: `${annee}-${m2}-${String(duOuDu[2]).padStart(2, '0')}`, au: `${annee}-${m2}-${String(duOuDu[2]).padStart(2, '0')}` },
        ];
      }
    }
    // Multi-line with multi-month: "13-16\n20-23\n27-30" with single month in moisParts
    // Try parsing with first parseable month
    const firstM = moisParts.map(parseMonth).find(Boolean);
    if (firstM) {
      const multiLines = jours.split(/[\r\n]+/).map(l => l.trim()).filter(Boolean);
      if (multiLines.length > 1) {
        const parsed = [];
        for (const line of multiLines) {
          const lm = line.match(/^(\d{1,2})\s*[-–]\s*(\d{1,2})$/);
          if (lm) {
            parsed.push({
              du: `${annee}-${firstM}-${String(lm[1]).padStart(2, '0')}`,
              au: `${annee}-${firstM}-${String(lm[2]).padStart(2, '0')}`,
            });
          }
        }
        if (parsed.length > 0) return parsed;
      }
    }
    // Try creating approx entries for each parseable month
    const approxEntries = moisParts.map(parseMonth).filter(Boolean).map(mp => makeApproxMonth(annee, mp));
    if (approxEntries.length > 0) return approxEntries;
    return [{ raw: `${jours} ${moisRaw} ${annee}`.trim() }];
  }

  const m = parseMonth(moisRaw);

  if (!m) {
    // Unparseable month (e.g. "été") - try to map common terms
    const SEASON_MAP = {
      'été': [makeApproxMonth(annee, '06'), makeApproxMonth(annee, '07'), makeApproxMonth(annee, '08')],
      'hiver': [makeApproxMonth(annee, '12'), makeApproxMonth(String(parseInt(annee)+1), '01'), makeApproxMonth(String(parseInt(annee)+1), '02')],
      'printemps': [makeApproxMonth(annee, '03'), makeApproxMonth(annee, '04'), makeApproxMonth(annee, '05')],
      'automne': [makeApproxMonth(annee, '09'), makeApproxMonth(annee, '10'), makeApproxMonth(annee, '11')],
    };
    const seasonKey = moisRaw.toLowerCase();
    if (SEASON_MAP[seasonKey]) return SEASON_MAP[seasonKey];
    // Try parsing moisRaw itself as a month (e.g. when jours is empty but moisRaw is "Mars")
    const mFromRaw = parseMonth(jours);
    if (mFromRaw) return [makeApproxMonth(annee, mFromRaw)];
    return [{ raw: `${jours} ${moisRaw} ${annee}`.trim() }];
  }

  // "entre 15-5" range
  const entreMatch = jours.match(/^entre\s+(\d{1,2})\s*[-–]\s*(\d{1,2})$/i);
  if (entreMatch) {
    return [{
      du: `${annee}-${m}-${String(entreMatch[1]).padStart(2, '0')}`,
      au: `${annee}-${m}-${String(entreMatch[2]).padStart(2, '0')}`,
      approx: true,
    }];
  }

  // "11-14 ou 8-10" or "19 ou 20" two options same month
  const ouMatch = jours.match(/^(\d{1,2})\s*[-–]\s*(\d{1,2})\s+ou\s+(\d{1,2})\s*[-–]\s*(\d{1,2})$/i);
  if (ouMatch) {
    return [
      { du: `${annee}-${m}-${String(ouMatch[1]).padStart(2, '0')}`, au: `${annee}-${m}-${String(ouMatch[2]).padStart(2, '0')}` },
      { du: `${annee}-${m}-${String(ouMatch[3]).padStart(2, '0')}`, au: `${annee}-${m}-${String(ouMatch[4]).padStart(2, '0')}` },
    ];
  }
  // "19 ou 20" single days
  const ouSingle = jours.match(/^(\d{1,2})\s+ou\s+(\d{1,2})$/i);
  if (ouSingle) {
    return [
      { du: `${annee}-${m}-${String(ouSingle[1]).padStart(2, '0')}`, au: `${annee}-${m}-${String(ouSingle[1]).padStart(2, '0')}` },
      { du: `${annee}-${m}-${String(ouSingle[2]).padStart(2, '0')}`, au: `${annee}-${m}-${String(ouSingle[2]).padStart(2, '0')}` },
    ];
  }

  // "06 au 08" or "5 au 7" or "du 17" style
  const auMatch = jours.match(/(?:du\s+)?(\d{1,2})\s+au\s+(\d{1,2})$/i);
  if (auMatch) {
    return [{
      du: `${annee}-${m}-${String(auMatch[1]).padStart(2, '0')}`,
      au: `${annee}-${m}-${String(auMatch[2]).padStart(2, '0')}`,
    }];
  }

  // "semaine du 16 au 20" or "semaine mai"
  const semaineAu = jours.match(/semaine\s+du\s+(\d{1,2})\s+au\s+(\d{1,2})/i);
  if (semaineAu) {
    return [{
      du: `${annee}-${m}-${String(semaineAu[1]).padStart(2, '0')}`,
      au: `${annee}-${m}-${String(semaineAu[2]).padStart(2, '0')}`,
    }];
  }

  // Multi-line ranges: "13-16\n20-23\n27-30" or "13-16\r\n20-23"
  // Also handles "18 septembre\n03 octobre" with per-line months
  const jourLines = jours.split(/[\r\n]+/).map(l => l.trim()).filter(Boolean);
  const moisLines = moisRaw.split(/[\r\n]+/).map(l => l.trim()).filter(Boolean);

  if (jourLines.length > 1 || moisLines.length > 1) {
    const multiDates = [];

    // Case: multi-month lines (e.g. mois = "Janvier\nFévrier\nMars") with single or no jours
    if (moisLines.length > 1 && jourLines.length <= 1) {
      for (const ml of moisLines) {
        const mp = parseMonth(ml);
        if (mp) multiDates.push(makeApproxMonth(annee, mp));
      }
      if (multiDates.length > 0) return multiDates;
    }

    // Case: each jour line may include its own month ("18 septembre")
    if (jourLines.length > 1) {
      for (let li = 0; li < jourLines.length; li++) {
        const line = jourLines[li];
        // "18 septembre" pattern
        const dayMonthMatch = line.match(/^(\d{1,2})\s+(\w+)$/);
        if (dayMonthMatch) {
          const lineMonth = parseMonth(dayMonthMatch[2]);
          if (lineMonth) {
            const d = `${annee}-${lineMonth}-${String(dayMonthMatch[1]).padStart(2, '0')}`;
            multiDates.push({ du: d, au: d });
            continue;
          }
        }
        // Day range
        const lm = line.match(/^(\d{1,2})\s*[-–]\s*(\d{1,2})$/);
        if (lm) {
          multiDates.push({
            du: `${annee}-${m}-${String(lm[1]).padStart(2, '0')}`,
            au: `${annee}-${m}-${String(lm[2]).padStart(2, '0')}`,
          });
        } else {
          const ls = line.match(/^(\d{1,2})$/);
          if (ls) {
            const d = `${annee}-${m}-${String(ls[1]).padStart(2, '0')}`;
            multiDates.push({ du: d, au: d });
          }
        }
      }
    }
    if (multiDates.length > 0) return multiDates;
    // Fallback for unparsed multi-line
    return [{ raw: `${jours} ${moisRaw} ${annee}`.trim() }];
  }

  // "30.11 au 03.12" - dd.mm format
  const ddmmAu = jours.match(/(\d{2})[.](\d{2})\s+au\s+(\d{2})[.](\d{2})/i);
  if (ddmmAu) {
    const m1 = ddmmAu[2];
    const m2 = ddmmAu[4];
    return [{
      du: `${annee}-${m1}-${ddmmAu[1]}`,
      au: `${annee}-${m2}-${ddmmAu[3]}`,
    }];
  }

  // "6 à 8" or "6 a 8"
  const aMatch = jours.match(/^(\d{1,2})\s+[àa]\s+(\d{1,2})$/i);
  if (aMatch) {
    return [{
      du: `${annee}-${m}-${String(aMatch[1]).padStart(2, '0')}`,
      au: `${annee}-${m}-${String(aMatch[2]).padStart(2, '0')}`,
    }];
  }

  // "27 et 28"
  const etMatch = jours.match(/^(\d{1,2})\s+et\s+(\d{1,2})$/i);
  if (etMatch) {
    return [{
      du: `${annee}-${m}-${String(etMatch[1]).padStart(2, '0')}`,
      au: `${annee}-${m}-${String(etMatch[2]).padStart(2, '0')}`,
    }];
  }

  // Day range
  const dayMatch = jours.match(/^(\d{1,2})\s*[-–]\s*(\d{1,2})$/);
  if (dayMatch) {
    return [{
      du: `${annee}-${m}-${String(dayMatch[1]).padStart(2, '0')}`,
      au: `${annee}-${m}-${String(dayMatch[2]).padStart(2, '0')}`,
    }];
  }

  // Single day
  const singleDay = jours.match(/^(\d{1,2})$/);
  if (singleDay) {
    const du = `${annee}-${m}-${String(singleDay[1]).padStart(2, '0')}`;
    return [{ du, au: du }];
  }

  // Excel serial date number
  if (/^\d{5}$/.test(jours)) {
    const excelEpoch = new Date(1899, 11, 30);
    const jsDate = new Date(excelEpoch.getTime() + parseInt(jours) * 86400000);
    const du = jsDate.toISOString().slice(0, 10);
    return [{ du, au: du }];
  }

  // If we have a valid month but couldn't parse the day, use approx month
  if (m) return [makeApproxMonth(annee, m)];

  return [{ raw: `${jours} ${moisRaw} ${annee}`.trim() }];
}

function parsePax(val) {
  if (val === null || val === undefined) return null;
  if (typeof val === 'number') return val;
  const s = String(val).trim();
  // "50 pax" or "70pax"
  const paxMatch = s.match(/^(\d+)\s*pax$/i);
  if (paxMatch) return parseInt(paxMatch[1]);
  // "25-35" range -> take max
  const rangeMatch = s.match(/^(\d+)\s*[-–àa]\s*(\d+)/);
  if (rangeMatch) return parseInt(rangeMatch[2]);
  // "60, max 70" -> take first number
  const numMatch = s.match(/^(\d+)/);
  if (numMatch) return parseInt(numMatch[1]);
  return null;
}

function parseTypeSociete(agence, entreprise) {
  if (agence === 1 || agence === 'x' || agence === 'X') return 'Agence';
  if (entreprise === 1 || entreprise === 'x' || entreprise === 'X') return 'Entreprise';
  return '';
}

function parseTypeSejour(groupe, seminaire) {
  const isGroupe = groupe === 1 || groupe === 'x' || groupe === 'X';
  const isSeminaire = seminaire === 1 || seminaire === 'x' || seminaire === 'X';
  // Règles: les deux cochés → Séminaire; groupe seul → Incentive
  if (isGroupe && isSeminaire) return 'Séminaire';
  if (isSeminaire) return 'Séminaire';
  if (isGroupe) return 'Incentive';
  return null;
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
  return s === 'oui' || s === '1' || s === 'x' || s.startsWith('oui');
}

function parseStatut(reservationVal) {
  const r = String(reservationVal || '').toLowerCase().trim();
  if (r === 'oui') return 'Confirmé';
  if (r === 'oui/activity only') return 'Confirmé';
  if (r === 'non') return 'Refusé';
  if (r === 'no rep' || r === 'pas de réponses') return 'En cours';
  if (r === "pas d'offre" || r === "pas d'offre envoyée") return "Pas d'offre envoyée";
  if (r.includes('annul')) return 'Annulé';
  if (r.includes('offres déclinées') || r.includes('décliné')) return 'Refusé';
  if (r === '' || r === 'null' || r === 'undefined') return 'En cours';
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

function parseCategorieHotel(val) {
  if (!val) return { std: null, autre: null };
  const s = String(val).trim();

  // Collect all explicit star values (e.g. "5*", "3*")
  const starMatch = s.match(/(\d)\*/g);
  const stars = new Set(starMatch ? starMatch.map(m => m) : []);

  // After removing star patterns, check remainder for implicit values
  let remainder = s.replace(/\d\*/g, '').replace(/[,\s]*ou\s*/gi, ' ').replace(/[,\s]*év\.\s*/gi, ' ').trim();

  // "3-4" → means 3* and 4*; "4-" → means 4*; bare "4" → means 4*
  const rangeMatch = remainder.match(/(\d)\s*[-–]\s*(\d)/);
  if (rangeMatch) {
    const lo = parseInt(rangeMatch[1]);
    const hi = parseInt(rangeMatch[2]);
    for (let n = lo; n <= hi; n++) stars.add(`${n}*`);
    remainder = remainder.replace(/\d\s*[-–]\s*\d/, '').trim();
  }
  // "4-" trailing dash → just that star level
  const trailingDash = remainder.match(/^(\d)\s*[-–]?\s*$/);
  if (trailingDash) {
    stars.add(`${trailingDash[1]}*`);
    remainder = '';
  }
  // Bare digit "4" or "5"
  const bareDigit = remainder.match(/^(\d)$/);
  if (bareDigit) {
    stars.add(`${bareDigit[1]}*`);
    remainder = '';
  }

  // Clean up remainder
  remainder = remainder.replace(/^[-–,\s]+|[-–,\s]+$/g, '').trim();

  const std = stars.size > 0
    ? [...stars].sort((a, b) => parseInt(a) - parseInt(b)).join(',')
    : null;

  return { std, autre: remainder || null };
}

// --- Summary labels to skip ---
const SUMMARY_LABELS = [
  "pas d'offre d'hébergements", "pas d'offre envoyée", 'annulé', 'confirmé',
  'en cours', 'sans réponse', 'total', 'refusé', 'statistiques',
  "pas d'offre d'hébergements / pas de confirmation",
];

// --- Transform ---
const results = [];
const issues = [];

for (let i = 0; i < dataRows.length; i++) {
  const row = dataRows[i];
  if (!row[0]) continue;

  const societe = String(row[0]).trim();
  if (SUMMARY_LABELS.includes(societe.toLowerCase())) continue;

  const dateEnvoiOffre = buildDateEnvoiOffre(row[1], row[2]);
  const typeSociete = parseTypeSociete(row[3], row[4]);
  const pays = row[5] ? String(row[5]).trim() : '';
  const email = row[6] ? String(row[6]).trim() : null;
  const langue = parseLang(row[7]);
  const titre = row[8] ? String(row[8]).trim() : null;
  const nom = row[9] ? String(row[9]).trim() : null;
  const prenom = row[10] ? String(row[10]).trim() : null;
  const dateOptions = buildDateOptions(row[11], row[12], row[13]);
  const activitesDemandees = parseOuiNon(row[14]);
  const nuits = row[15] !== null && row[15] !== undefined ? String(row[15]) : null;

  // Fix: if du == au and we have nuits > 1, compute au = du + nuits
  const nuitsNum = nuits ? parseInt(nuits) : 0;
  if (nuitsNum > 1) {
    for (const opt of dateOptions) {
      if (opt.du && opt.au && opt.du === opt.au && !opt.approximatif) {
        const d = new Date(opt.du);
        d.setDate(d.getDate() + nuitsNum);
        opt.au = d.toISOString().slice(0, 10);
      }
    }
  }
  // Activités demandées + 0 nuit → activiteUniquement
  const activiteUniquement = activitesDemandees && (nuits === '0' || nuits === null);
  const pax = parsePax(row[16]);
  const paxStr = row[16] !== null ? String(row[16]) : null;
  const transmisPar = row[17] ? String(row[17]).trim() : null;
  const typeSejour = parseTypeSejour(row[18], row[19]);
  const seminaire = row[19] === 1 || row[19] === 'x' || row[19] === 'X';
  const cat = parseCategorieHotel(row[20]);
  const stationDemandee = parseStation(row[21], row[22]);
  const remarques = row[23] ? String(row[23]).trim() : null;
  const relanceStr = row[24] ? String(row[24]).trim() : null;
  const retourHotels = parseOuiNon(row[25]);
  const reservationVal = row[26];
  const contactBrevo = parseOuiNon(row[27]);
  const feedback = row[28] ? String(row[28]).trim() : null;
  const traitePar = row[29] ? String(row[29]).trim() : null;
  const statut = parseStatut(reservationVal);
  const hotelSends = parseHotelSends(row);

  // Build notes
  const noteParts = [];
  if (remarques) noteParts.push(`Remarques: ${remarques}`);
  if (feedback) noteParts.push(`Feedback: ${feedback}`);
  const notes = noteParts.join(' | ') || null;

  // Track issues
  const rowIssues = [];
  if (!dateEnvoiOffre) rowIssues.push('Date envoi offre non parsée');
  if (dateOptions.length > 0 && dateOptions[0].raw) rowIssues.push(`Dates séjour brut: ${dateOptions[0].raw}`);
  if (paxStr && pax === null && paxStr !== 'null') rowIssues.push(`Pax non numérique: ${paxStr}`);

  // Parse relance date if it looks like a date
  let relanceDate = null;
  if (relanceStr) {
    const dateMatch = relanceStr.match(/(\d{2})[./](\d{2})[./](\d{2,4})/);
    if (dateMatch) {
      const yr = dateMatch[3].length === 2 ? '20' + dateMatch[3] : dateMatch[3];
      relanceDate = `${yr}-${dateMatch[2]}-${dateMatch[1]}`;
    }
  }

  const entry = {
    rowIndex: i + 3,
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
      nombrePax: pax,
      transmisPar,
      typeSejour,
      categorieHotel: cat.std,
      categorieHotelAutre: cat.autre,
      stationDemandee,
      traitePar,
      dateEnvoiOffre,
      dateOptions: dateOptions.filter(d => !d.raw),
      statut,
      reservationEffectuee: parseOuiNon(reservationVal),
      contactEntreDansBrevo: contactBrevo,
      retourEffectueHotels: retourHotels,
      activiteUniquement,
      activitesDemandees,
      seminaire,
      relanceEffectueeLe: relanceDate,
    },
    hotelSends,
    notes,
  };

  if (dateOptions.some(d => d.raw)) {
    entry.rawDates = dateOptions.filter(d => d.raw).map(d => d.raw);
  }

  if (rowIssues.length > 0) {
    entry.issues = rowIssues;
    issues.push({ row: i + 3, societe, issues: rowIssues });
  }

  results.push(entry);
}

// Output
const output = {
  file: year,
  totalRows: results.length,
  issueCount: issues.length,
  issues,
  offers: results,
};

const outFile = `Historique/${year}_structured.json`;
fs.writeFileSync(outFile, JSON.stringify(output, null, 2));
console.log(`✓ ${results.length} offres extraites, ${issues.length} avec problèmes`);

if (issues.length > 0) {
  console.log('\nCas avec problèmes:');
  issues.forEach(iss => {
    console.log(`  Row ${iss.row} (${iss.societe}): ${iss.issues.join(', ')}`);
  });
}

// Summary stats
const statuts = {};
results.forEach(r => { statuts[r.offer.statut] = (statuts[r.offer.statut] || 0) + 1; });
console.log('\nStatuts:');
Object.entries(statuts).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log(`  ${k}: ${v}`));

const allHotels = new Set();
results.forEach(r => r.hotelSends.forEach(h => allHotels.add(h)));
console.log('\nHôtels référencés:', [...allHotels].join(', '));

const transmisParSet = new Set();
results.forEach(r => { if (r.offer.transmisPar) transmisParSet.add(r.offer.transmisPar); });
console.log('Transmis par:', [...transmisParSet].join(', '));

const traiteParSet = new Set();
results.forEach(r => { if (r.offer.traitePar) traiteParSet.add(r.offer.traitePar); });
console.log('Traité par:', [...traiteParSet].join(', '));
