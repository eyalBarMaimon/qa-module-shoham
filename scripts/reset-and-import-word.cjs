/**
 * reset-and-import-word.js
 * Clears all Firestore collections, then imports fresh data from Word files.
 * Usage: node scripts/reset-and-import-word.js
 */

const mammoth = require('mammoth');
const path = require('path');
const fs = require('fs');

const PROJECT_ID = 'qa-module-shoham';
const API_KEY = 'AIzaSyDYkA79H18i2CoORpCHxxkhPDhQYnnxP54';
const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;
const WORD_DIR = path.join(__dirname, '..', '..', 'word_docs');

// ── Firestore REST API ──────────────────────────────────────────────────────

function toFirestore(obj) {
  const fields = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === null || v === undefined) continue;
    fields[k] = { stringValue: String(v) };
  }
  return { fields };
}

async function listDocs(collection) {
  const docs = [];
  let pageToken = '';
  do {
    const url = `${BASE}/${collection}?key=${API_KEY}&pageSize=300${pageToken ? '&pageToken=' + encodeURIComponent(pageToken) : ''}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.documents) docs.push(...data.documents);
    pageToken = data.nextPageToken || '';
  } while (pageToken);
  return docs;
}

async function deleteDoc(name) {
  // name is a relative path like "projects/.../documents/Collection/DocId"
  const url = `https://firestore.googleapis.com/v1/${name}?key=${API_KEY}`;
  const res = await fetch(url, { method: 'DELETE' });
  if (!res.ok && res.status !== 404) {
    console.warn(`  Warning: DELETE returned ${res.status}`);
  }
}

async function createDoc(collection, data) {
  const res = await fetch(`${BASE}/${collection}?key=${API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(toFirestore(data)),
  });
  const json = await res.json();
  if (json.error) throw new Error(`Firestore error creating doc in ${collection}: ${JSON.stringify(json.error)}`);
  return json;
}

async function clearCollection(collection) {
  process.stdout.write(`  Clearing ${collection}... `);
  const docs = await listDocs(collection);
  if (docs.length === 0) { console.log('(empty)'); return; }
  for (const doc of docs) await deleteDoc(doc.name);
  console.log(`deleted ${docs.length} docs`);
}

// ── Parsing helpers ─────────────────────────────────────────────────────────

function extractRows(html) {
  const trs = html.match(/<tr[^>]*>([\s\S]*?)<\/tr>/g) || [];
  return trs.map(tr =>
    (tr.match(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g) || [])
      .map(td => td.replace(/<[^>]+>/g, '').replace(/&[^;]+;/g, ' ').replace(/\s+/g, ' ').trim())
  );
}

// Normalize dates from DD.MM.YYYY / D.M.YYYY / D/M/YYYY → DD/MM/YYYY
// Also handles MM/YYYY → 01/MM/YYYY
function normDate(s) {
  if (!s) return '';
  s = s.trim();
  // Already DD/MM/YYYY
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) return s;
  // D/M/YYYY or DD/M/YYYY
  const m1 = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m1) return m1[1].padStart(2, '0') + '/' + m1[2].padStart(2, '0') + '/' + m1[3];
  // DD.MM.YYYY or D.M.YYYY
  const m2 = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (m2) return m2[1].padStart(2, '0') + '/' + m2[2].padStart(2, '0') + '/' + m2[3];
  // MM/YYYY or M/YYYY
  const m3 = s.match(/^(\d{1,2})\/(\d{4})$/);
  if (m3) return '01/' + m3[1].padStart(2, '0') + '/' + m3[2];
  return s;
}

// Extract only the leading date from a string that may have extra text
function extractLeadingDate(s) {
  if (!s) return s;
  const m = s.match(/^(\d{2}\/\d{2}\/\d{4})/);
  return m ? m[1] : normDate(s.split(/[^\d\/\.]/)[0]);
}

// ── Importers ──────────────────────────────────────────────────────────────

async function importTools() {
  const file = path.join(WORD_DIR, 'F-7.6.1 Tool Calibrating Log REV02.docx');
  const { value: html } = await mammoth.convertToHtml({ path: file });
  const rows = extractRows(html);

  let count = 0;
  for (const row of rows) {
    if (row.length < 8) continue;
    // Data rows have an integer in column 0
    if (!row[0] || !/^\d+$/.test(row[0].trim())) continue;

    const num = row[0].trim();
    const name = row[1] || '';
    const serial = row[2] || '';
    const date = row[5] || '';   // תאריך בדיקה (already DD/MM/YYYY in this file)
    const nextRaw = row[8] || '';

    // Next calibration: strip trailing non-date text
    let next = extractLeadingDate(nextRaw) || nextRaw;
    // If it starts with "לא" keep as-is, if it's '-' treat as empty
    if (next === '-') next = '';

    const location = row[9] || '';

    await createDoc('Tools', {
      '#': num,
      'שם המכשיר': name,
      'מספר סידורי': serial,
      'תאריך בדיקה': date,
      'מועד הבא': next,
      'מיקום': location,
    });
    process.stdout.write('.');
    count++;
  }
  console.log(`\n  ✓ ${count} tools`);
}

async function importMachines() {
  const file = path.join(WORD_DIR, 'F-7.6.1-1 Machine Calibrating Log  REV02.docx');
  const { value: html } = await mammoth.convertToHtml({ path: file });
  const rows = extractRows(html);

  let count = 0;
  for (const row of rows) {
    if (row.length < 10) continue;
    // Machine rows: col[2] is machine number (W001, EQ0001, C001 …)
    if (!row[2] || !/^[A-Z]/.test(row[2])) continue;

    const machineNum = row[2];
    const name = row[3] || '';
    const manufacturer = row[5] || '';
    const calibDateRaw = row[7] || '';
    const nextRaw = row[10] || '';
    const location = row[11] || '';

    const calibDate = normDate(calibDateRaw);
    let next = normDate(nextRaw);
    if (!next && nextRaw.startsWith('לא')) next = nextRaw; // preserve 'לא בשימוש'

    await createDoc('Machines', {
      'מ. מכונה': machineNum,
      'שם': name,
      'יצרן': manufacturer,
      'תאריך כיול': calibDate,
      'מועד הבא': next,
      'מיקום': location,
    });
    process.stdout.write('.');
    count++;
  }
  console.log(`\n  ✓ ${count} machines`);
}

async function importFilters() {
  const file = path.join(WORD_DIR, 'REV02 F-7.6.1-2 Filter maintenance Log.docx');
  const { value: html } = await mammoth.convertToHtml({ path: file });
  const rows = extractRows(html);

  let count = 0;
  for (const row of rows) {
    if (row.length < 5) continue;
    const filterNum = row[1] || '';
    // Skip headers and signature rows
    if (!filterNum || filterNum === 'מספר פילטר' || row[0] === 'שם') continue;

    const machineName = row[3] || '';
    const machineNum = row[4] || '';

    let location, freq;
    if (row.length >= 13) {
      // Standard row: [0]=rowNum [1]=filterNum [2]=domain [3]=machine [4]=machineNum
      // [5]=serial [6]=manufacturer [7]=location [8]=freq [9-12]=dates
      location = row[7] || '';
      freq = row[8] || '';
    } else {
      // Short row (missing location or date cols)
      location = '';
      freq = row[row.length - 1] || '';
    }

    // Find latest non-empty date from cols 9-12
    let lastDate = '';
    for (let i = 9; i <= 12 && i < row.length; i++) {
      if (row[i] && row[i].trim()) lastDate = normDate(row[i]);
    }

    await createDoc('Filters', {
      'מ. פילטר': filterNum,
      'מכונה': machineName,
      'מ. מכונה': machineNum,
      'מיקום': location,
      'תדירות': freq,
      'תאריך אחרון': lastDate,
    });
    process.stdout.write('.');
    count++;
  }
  console.log(`\n  ✓ ${count} filters`);
}

async function importSuppliers() {
  const file = path.join(WORD_DIR, 'Suppliers List_.docx');
  const { value: html } = await mammoth.convertToHtml({ path: file });
  const rows = extractRows(html);

  let count = 0;
  for (const row of rows) {
    if (row.length < 4) continue;
    const num = parseInt(row[0]);
    if (!num || isNaN(num)) continue;

    const name = row[1] || '';
    // Fix merged cert strings
    let cert = (row[2] || '').replace('ISO9001ISO13485', 'ISO9001, ISO13485').replace('ISO9001AS9100', 'ISO9001, AS9100');
    // Fix merged date strings (two dates concatenated)
    let dueDateRaw = row[3] || '';
    if (dueDateRaw.length > 10) dueDateRaw = dueDateRaw.substring(0, 10);
    let dueDate = normDate(dueDateRaw);
    if (dueDate === '-' || dueDate === '—') dueDate = '';

    const remarks = row[4] || '';

    await createDoc('Suppliers', {
      '#': String(num),
      'שם ספק': name,
      'סוג הסמכה': cert,
      'תוקף עד': dueDate,
      'הערות': remarks,
    });
    process.stdout.write('.');
    count++;
  }
  console.log(`\n  ✓ ${count} suppliers`);
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('=== Step 1: Clearing all collections ===');
  const collections = [
    'Tools', 'Machines', 'Filters', 'Suppliers', 'Lamps',
    'ToolsHistory', 'MachinesHistory', 'FiltersHistory',
    'SuppliersHistory', 'LampsHistory',
    'Training', 'TrainingHistory', 'Employees',
  ];
  for (const col of collections) {
    await clearCollection(col);
  }

  console.log('\n=== Step 2: Importing from Word files ===');
  console.log('Tools...');
  await importTools();
  console.log('Machines...');
  await importMachines();
  console.log('Filters...');
  await importFilters();
  console.log('Suppliers...');
  await importSuppliers();

  console.log('\n✅ Import complete!');
}

main().catch(err => { console.error('\n❌ Fatal error:', err); process.exit(1); });
