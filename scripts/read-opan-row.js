const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const fp = path.join(__dirname, '..', 'Historique', 'Etat des offres et statistiques 2023.xlsx');
const wb = XLSX.read(fs.readFileSync(fp), { type: 'buffer', cellDates: true });
const ws = wb.Sheets[wb.SheetNames[0]];
const range = XLSX.utils.decode_range(ws['!ref']);

// Read headers (rows 0-1)
const headers = [];
for (let c = 0; c <= range.e.c; c++) {
  const c1 = ws[XLSX.utils.encode_cell({ r: 0, c })];
  const c2 = ws[XLSX.utils.encode_cell({ r: 1, c })];
  const h1 = c1 ? String(c1.v || '').trim() : '';
  const h2 = c2 ? String(c2.v || '').trim() : '';
  headers.push({ col: c, h1, h2 });
}

// Print headers
console.log('=== HEADERS ===');
for (const h of headers) {
  if (h.h1 || h.h2) console.log(`  Col ${h.col}: "${h.h1}" / "${h.h2}"`);
}

// Find OPAN row
for (let r = 2; r <= range.e.r; r++) {
  const societeCell = ws[XLSX.utils.encode_cell({ r, c: 0 })];
  const societe = societeCell ? String(societeCell.v || '').trim() : '';
  if (societe.includes('OPAN')) {
    console.log(`\n=== OPAN row ${r + 1} ===`);
    for (let c = 0; c <= range.e.c; c++) {
      const cell = ws[XLSX.utils.encode_cell({ r, c })];
      if (cell && cell.v !== undefined && cell.v !== null && cell.v !== '') {
        const h = headers[c] || {};
        console.log(`  Col ${c} (${h.h1 || h.h2 || '?'}): ${JSON.stringify(cell.v)}`);
      }
    }
  }
}
