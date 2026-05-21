/**
 * One-time import script: Word docs → Firebase Firestore
 * Run: node scripts/import-to-firebase.mjs
 */

import mammoth from 'mammoth';
import * as cheerio from 'cheerio';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, deleteDoc } from 'firebase/firestore';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DOCS_DIR = path.join(__dirname, '../../word_docs');

// Firebase config (same as app)
const firebaseConfig = {
  apiKey:            'AIzaSyDYkA79H18i2CoORpCHxxkhPDhQYnnxP54',
  authDomain:        'qa-module-shoham.firebaseapp.com',
  projectId:         'qa-module-shoham',
  storageBucket:     'qa-module-shoham.firebasestorage.app',
  messagingSenderId: '224873227518',
  appId:             '1:224873227518:web:0db295848b1888793ff1af',
};

const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);

// ── Helpers ──────────────────────────────────────────────────────────────────

function normalizeDate(s) {
  if (!s) return '';
  // DD.MM.YYYY → DD/MM/YYYY
  return s.replace(/(\d{1,2})\.(\d{1,2})\.(\d{4})/, '$1/$2/$3');
}

async function parseDocx(filename) {
  const result = await mammoth.convertToHtml({ path: path.join(DOCS_DIR, filename) });
  return result.value;
}

function extractTables(html) {
  const $ = cheerio.load(html);
  const tables = [];
  $('table').each((_, table) => {
    const rows = [];
    $(table).find('tr').each((_, tr) => {
      const cells = [];
      $(tr).find('td').each((_, td) => {
        cells.push($(td).text().trim().replace(/\s+/g, ' '));
      });
      rows.push(cells);
    });
    tables.push(rows);
  });
  return tables;
}

function isHeaderRow(row, keywords) {
  return keywords.some(k => row.some(c => c === k));
}

async function clearCollection(name) {
  const snap = await getDocs(collection(db, name));
  for (const doc of snap.docs) await deleteDoc(doc.ref);
  console.log(`  Cleared ${snap.size} existing docs from ${name}`);
}

async function importDocs(collName, docs) {
  const col = collection(db, collName);
  for (const doc of docs) await addDoc(col, doc);
  console.log(`  ✓ Imported ${docs.length} docs into ${collName}`);
}

// ── Parsers ───────────────────────────────────────────────────────────────────

async function parseTools() {
  const html   = await parseDocx('F-7.6.1 Tool Calibrating Log REV02.docx');
  const tables = extractTables(html);
  const docs   = [];

  for (const table of tables) {
    for (const row of table) {
      if (row.length < 5) continue;
      if (isHeaderRow(row, ['מספר', 'שם המכשיר', 'No'])) continue;
      const [num, name, serial, range, accuracy, testDate, freq, lab, nextDate, location] = row;
      if (!name) continue;
      docs.push({
        '#':              num || '',
        'שם המכשיר':     name,
        'מספר סידורי':   serial || '',
        'תחום מדידה':    range  || '',
        'דיוק':          accuracy || '',
        'תאריך בדיקה':  normalizeDate(testDate) || '',
        'תדירות':        freq   || '',
        'מעבדה':         lab    || '',
        'מועד הבא':      normalizeDate(nextDate) || '',
        'מיקום':         location || '',
      });
    }
  }
  return docs;
}

async function parseMachines() {
  const html   = await parseDocx('F-7.6.1-1 Machine Calibrating Log  REV02.docx');
  const tables = extractTables(html);
  const docs   = [];

  for (const table of tables) {
    for (const row of table) {
      if (row.length < 5) continue;
      if (isHeaderRow(row, ['מספר', 'מספר מכונה', 'No'])) continue;
      // cols: מספר, תחום, מספר מכונה, שם המכשיר, מספר סידורי, יצרן, תדירות אחזקה, תאריך בדיקה, שם מבצע, תדירות פילטר, מועד הבא, מיקום
      const [num, domain, machineId, name, serial, manufacturer, maintFreq, testDate, inspector, filterFreq, nextDate, location] = row;
      if (!name && !machineId) continue;
      docs.push({
        'מ. מכונה':      machineId || '',
        'שם':            name      || '',
        'יצרן':          manufacturer || '',
        'תחום':          domain    || '',
        'מספר סידורי':   serial    || '',
        'תאריך כיול':   normalizeDate(testDate) || '',
        'מועד הבא':      normalizeDate(nextDate) || '',
        'מיקום':         location  || '',
      });
    }
  }
  return docs;
}

async function parseFilters() {
  const html   = await parseDocx('REV02 F-7.6.1-2 Filter maintenance Log.docx');
  const tables = extractTables(html);
  const docs   = [];

  for (const table of tables) {
    for (const row of table) {
      if (row.length < 5) continue;
      if (isHeaderRow(row, ['מספר פילטר', 'שם', 'תחום', 'שם המכשיר'])) continue;
      // cols: מספר, מספר פילטר, תחום, שם המכשיר, מספר מכונה, מספר סידורי, יצרן, מיקום, תדירות, date1, date2, date3, date4
      const [num, filterId, domain, machineName, machineId, serial, manufacturer, location, freq, d1, d2, d3, d4] = row;
      if (!filterId && !machineName) continue;

      // Take last non-empty date as "תאריך אחרון"
      const lastDate = [d4, d3, d2, d1].find(d => d && d.trim()) || '';

      // "לא בשימוש" / "לא נדרש פילטר" appear in the freq cell when row spans
      const frequency = freq || '';

      docs.push({
        'מ. פילטר':     filterId     || '',
        'מכונה':        machineName  || '',
        'מ. מכונה':     machineId    || '',
        'מיקום':        location     || '',
        'תדירות':       frequency,
        'תאריך אחרון': normalizeDate(lastDate),
      });
    }
  }
  return docs;
}

async function parseSuppliers() {
  const html   = await parseDocx('Suppliers List_.docx');
  const tables = extractTables(html);
  const docs   = [];

  for (const table of tables) {
    for (const row of table) {
      if (row.length < 4) continue;
      if (isHeaderRow(row, ['No', 'Supplier', 'List of'])) continue;
      const [num, name, iso, due, remarks] = row;
      if (!name || !num || isNaN(parseInt(num))) continue;
      docs.push({
        '#':           num,
        'שם ספק':     name,
        'תעודת ISO':  iso     || '-',
        'תוקף עד':    normalizeDate(due) || '',
        'הערות':       remarks || '',
      });
    }
  }
  return docs;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Parsing Word documents...\n');

  const [tools, machines, filters, suppliers] = await Promise.all([
    parseTools(),
    parseMachines(),
    parseFilters(),
    parseSuppliers(),
  ]);

  console.log(`Parsed: Tools=${tools.length}, Machines=${machines.length}, Filters=${filters.length}, Suppliers=${suppliers.length}\n`);

  console.log('Importing to Firestore...\n');

  await clearCollection('Tools');
  await importDocs('Tools', tools);

  await clearCollection('Machines');
  await importDocs('Machines', machines);

  await clearCollection('Filters');
  await importDocs('Filters', filters);

  await clearCollection('Suppliers');
  await importDocs('Suppliers', suppliers);

  console.log('\n✅ Import complete!');
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
