/**
 * read-excel-colors.js
 * Read Excel files and extract row colors to determine actual statut
 * Usage: NODE_PATH=client/node_modules node scripts/read-excel-colors.js
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
  // Handle ARGB format (e.g., "FF92D050" → "92D050")
  if (rgb.length === 8) rgb = rgb.slice(2);
  return rgb.toUpperCase();
}

function getCellColor(ws, cellRef) {
  const cell = ws[cellRef];
  if (!cell || !cell.s) return null;
  const fill = cell.s.fgColor || cell.s.bgColor;
  if (!fill) return null;
  if (fill.rgb) return rgbToHex(fill.rgb);
  if (fill.theme !== undefined) return `theme:${fill.theme}`;
  return null;
}

for (const [year, filename] of Object.entries(FILES)) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`${year}: ${filename}`);
  console.log('='.repeat(60));

  const fp = path.join(HIST_DIR, filename);
  const wb = XLSX.read(fs.readFileSync(fp), { type: 'buffer', cellStyles: true });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const range = XLSX.utils.decode_range(ws['!ref']);

  // Read headers (row 1 and 2)
  const headers = [];
  for (let c = range.s.c; c <= range.e.c; c++) {
    const cell1 = ws[XLSX.utils.encode_cell({ r: 0, c })];
    const cell2 = ws[XLSX.utils.encode_cell({ r: 1, c })];
    const h1 = cell1 ? String(cell1.v || '').trim() : '';
    const h2 = cell2 ? String(cell2.v || '').trim() : '';
    headers.push(h1 || h2);
  }

  // Find société column (usually col A or B)
  let societeCol = -1;
  for (let c = 0; c < headers.length; c++) {
    const h = headers[c].toLowerCase();
    if (h.includes('société') || h.includes('societe') || h.includes('contact')) {
      societeCol = c;
      break;
    }
  }
  if (societeCol === -1) societeCol = 1; // fallback

  // Collect all row colors (use first data column as reference)
  const colorMap = {}; // color → [{row, societe}]
  const rowColors = []; // [{row, societe, color}]

  for (let r = 2; r <= range.e.r; r++) {
    // Get société
    const societeCell = ws[XLSX.utils.encode_cell({ r, c: societeCol })];
    const societe = societeCell ? String(societeCell.v || '').trim() : '';
    if (!societe) continue;

    // Try to get color from multiple cells in the row
    let color = null;
    for (let c = 0; c <= Math.min(range.e.c, 10); c++) {
      const ref = XLSX.utils.encode_cell({ r, c });
      const cell = ws[ref];
      if (cell && cell.s) {
        const fg = cell.s.fgColor;
        if (fg && fg.rgb) {
          color = rgbToHex(fg.rgb);
          break;
        }
      }
    }

    rowColors.push({ row: r + 1, societe, color });
    if (color) {
      if (!colorMap[color]) colorMap[color] = [];
      colorMap[color].push({ row: r + 1, societe });
    }
  }

  // Summary
  console.log(`\nTotal data rows: ${rowColors.length}`);
  console.log(`Rows with color: ${rowColors.filter(r => r.color).length}`);
  console.log(`Rows without color: ${rowColors.filter(r => !r.color).length}`);

  console.log('\nColor distribution:');
  const sorted = Object.entries(colorMap).sort((a, b) => b[1].length - a[1].length);
  for (const [color, rows] of sorted) {
    console.log(`  #${color}: ${rows.length} rows — e.g. "${rows[0].societe}"`);
  }

  console.log('\nRows without color:');
  for (const r of rowColors.filter(r => !r.color).slice(0, 5)) {
    console.log(`  Row ${r.row}: "${r.societe}"`);
  }
}
