const fs = require('fs');
const d = JSON.parse(fs.readFileSync('Historique/2023_structured.json', 'utf-8'));
console.log('type:', typeof d, 'isArray:', Array.isArray(d));
if (Array.isArray(d)) {
  console.log('length:', d.length);
  console.log('first item keys:', Object.keys(d[0] || {}));
  console.log('first item:', JSON.stringify(d[0], null, 2).slice(0, 500));
} else {
  console.log('keys:', Object.keys(d));
}
