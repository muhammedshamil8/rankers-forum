const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(process.cwd(), 'UG Data 2025.xlsx');
const workbook = XLSX.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const rows = XLSX.utils.sheet_to_json(sheet);

console.log('Total rows:', rows.length);
console.log('Headers:', Object.keys(rows[0] || {}));

const rowsWithMissingState = rows.filter(r => !r['State']);
const rowsWithMissingCity = rows.filter(r => !r['City']);

console.log('Rows missing State:', rowsWithMissingState.length);
console.log('Rows missing City:', rowsWithMissingCity.length);

if (rowsWithMissingState.length > 0) {
  console.log('Example row missing State:', JSON.stringify(rowsWithMissingState[0], null, 2));
}
if (rowsWithMissingCity.length > 0) {
  console.log('Example row missing City:', JSON.stringify(rowsWithMissingCity[0], null, 2));
}
