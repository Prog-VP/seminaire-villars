/**
 * read-excel-legend.js
 * Read the legend rows at the bottom of each Excel file to map colors to statuts
 */
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const HIST_DIR = path.join(__dirname, '..', 'Historique');

const FILES = {
  2023: 'Etat des offres et statistiques 2023.xlsx',
  2024: 'Etat des offres et statistiques 2024_new.xlsx',
  2025: 'Etat des offres et statistiques 2025.xlsx',
  2026: 'Etat des offres et statistiques 2026.xlsx',
};

function rgbToHex(rgb) {
  if (!rgb) return null;
  if (rgb.length === 8) rgb = rgb.slice(2);
  return rgb.toUpperCase();
}

for (const [year, filename] of Object.entries(FILES)) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`${year}: ${filename}`);
  console.log('='.repeat(60));

  const fp = path.join(HIST_DIR, filename);
  const wb = XLSX.read(fs.readFileSync(fp), { type: 'buffer', cellStyles: true });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const range = XLSX.utils.decode_range(ws['!ref']);

  // Scan ALL rows from the bottom, looking for legend entries
  // Legend rows typically have a label like "Confirmé", "Refusé", "En cours", etc.
  const LEGEND_KEYWORDS = [
    'confirmé', 'confirme', 'refusé', 'refuse', 'en cours', 'annulé', 'annule',
    "pas d'offre", 'sans réponse', 'sans reponse', 'pas d\'hébergement',
    "pas de confirmation", "pas d'offre d'hébergement"
  ];

  console.log('\nScanning all rows for legend (last 20 rows):');
  for (let r = Math.max(range.e.r - 20, 0); r <= range.e.r; r++) {
    const cells = [];
    for (let c = 0; c <= Math.min(range.e.c, 15); c++) {
      const ref = XLSX.utils.encode_cell({ r, c });
      const cell = ws[ref];
      if (cell) {
        let color = null;
        if (cell.s && cell.s.fgColor && cell.s.fgColor.rgb) {
          color = rgbToHex(cell.s.fgColor.rgb);
        }
        const val = String(cell.v || '').trim();
        if (val || color) {
          cells.push({ col: c, val, color });
        }
      }
    }
    if (cells.length > 0) {
      const parts = cells.map(c => {
        const colorStr = c.color ? ` [#${c.color}]` : '';
        return `col${c.col}="${c.val}"${colorStr}`;
      });
      console.log(`  Row ${r + 1}: ${parts.join(' | ')}`);
    }
  }

  // Now specifically find colored cells with legend text
  console.log('\nLegend entries found:');
  for (let r = 0; r <= range.e.r; r++) {
    for (let c = 0; c <= Math.min(range.e.c, 20); c++) {
      const ref = XLSX.utils.encode_cell({ r, c });
      const cell = ws[ref];
      if (!cell) continue;
      const val = String(cell.v || '').trim().toLowerCase();
      if (LEGEND_KEYWORDS.some(kw => val.includes(kw))) {
        let color = null;
        if (cell.s && cell.s.fgColor && cell.s.fgColor.rgb) {
          color = rgbToHex(cell.s.fgColor.rgb);
        }
        console.log(`  Row ${r + 1}, Col ${c}: "${String(cell.v || '').trim()}" → color: ${color ? '#' + color : 'none'}`);
      }
    }
  }
}
