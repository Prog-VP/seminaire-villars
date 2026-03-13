/**
 * read-excel.js
 * Reads an Excel file and outputs raw JSON (headers + rows), trimmed to useful columns
 * Usage: node scripts/read-excel.js "path/to/file.xlsx" [sheetIndex]
 */
const XLSX = require('xlsx');
const path = require('path');

const filePath = process.argv[2];
const sheetIndex = parseInt(process.argv[3] || '0', 10);

if (!filePath) {
  console.error('Usage: node scripts/read-excel.js <file.xlsx> [sheetIndex]');
  process.exit(1);
}

const workbook = XLSX.readFile(path.resolve(filePath));
const sheet = workbook.Sheets[workbook.SheetNames[sheetIndex]];
const range = XLSX.utils.decode_range(sheet['!ref']);

// Read all cells
const allRows = [];
for (let r = range.s.r; r <= range.e.r; r++) {
  const row = [];
  for (let c = range.s.c; c <= range.e.c; c++) {
    const addr = XLSX.utils.encode_cell({ r, c });
    const cell = sheet[addr];
    if (cell) {
      if (cell.t === 'd' || (cell.t === 'n' && cell.w && /\d{2}[./-]\d{2}[./-]\d{2,4}/.test(cell.w))) {
        row.push({ v: cell.v, w: cell.w, t: cell.t });
      } else {
        row.push(cell.v);
      }
    } else {
      row.push(null);
    }
  }
  allRows.push(row);
}

// Find last useful column (last col with any non-null data)
let maxCol = 0;
for (const row of allRows) {
  for (let c = row.length - 1; c >= 0; c--) {
    if (row[c] !== null) {
      if (c > maxCol) maxCol = c;
      break;
    }
  }
}

// Trim rows
const rows = allRows.map(r => r.slice(0, maxCol + 1));

// Remove fully empty trailing rows
while (rows.length > 0 && rows[rows.length - 1].every(c => c === null)) {
  rows.pop();
}

// Merges
const merges = (sheet['!merges'] || []).map(m => ({
  start: XLSX.utils.encode_cell(m.s),
  end: XLSX.utils.encode_cell(m.e),
}));

const output = {
  sheet: workbook.SheetNames[sheetIndex],
  totalRows: rows.length,
  totalCols: maxCol + 1,
  merges,
  headers: rows.slice(0, 3),
  data: rows.slice(3),
};

console.log(JSON.stringify(output, null, 2));
