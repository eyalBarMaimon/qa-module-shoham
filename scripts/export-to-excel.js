/**
 * Firebase → Excel export script
 * Usage: npm run export
 * Output: exports/Shoham_Export_DD-MM-YYYY.xlsx
 */

import { readFileSync, mkdirSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import * as XLSX from 'xlsx';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// --- read .env.local ---
function loadEnv() {
  const envPath = join(ROOT, '.env.local');
  if (!existsSync(envPath)) {
    console.error('ERROR: .env.local not found at', envPath);
    process.exit(1);
  }
  return Object.fromEntries(
    readFileSync(envPath, 'utf8')
      .split('\n')
      .filter(l => l && !l.startsWith('#') && l.includes('='))
      .map(l => {
        const idx = l.indexOf('=');
        return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()];
      })
  );
}

// --- collections to export ---
const COLLECTIONS = [
  { id: 'Tools',           sheet: 'כלי מדידה' },
  { id: 'ToolsHistory',    sheet: 'היסטוריה - כלי מדידה' },
  { id: 'Machines',        sheet: 'מכונות' },
  { id: 'MachinesHistory', sheet: 'היסטוריה - מכונות' },
  { id: 'Filters',         sheet: 'פילטרים' },
  { id: 'FiltersHistory',  sheet: 'היסטוריה - פילטרים' },
  { id: 'Lamps',           sheet: 'מנורות' },
  { id: 'LampsHistory',    sheet: 'היסטוריה - מנורות' },
  { id: 'Suppliers',       sheet: 'ספקים' },
  { id: 'SuppliersHistory',sheet: 'היסטוריה - ספקים' },
  { id: 'Training',        sheet: 'הדרכות' },
  { id: 'TrainingHistory', sheet: 'היסטוריה - הדרכות' },
  { id: 'Employees',       sheet: 'עובדים' },
];

// --- clean a doc: remove internal fields, flatten arrays ---
function cleanDoc(data) {
  const { _status, ...rest } = data;
  return Object.fromEntries(
    Object.entries(rest).map(([k, v]) => [
      k,
      Array.isArray(v) ? v.join(', ') : v ?? '',
    ])
  );
}

// --- today as DD-MM-YYYY ---
function todayStr() {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}-${mm}-${d.getFullYear()}`;
}

async function main() {
  const env = loadEnv();

  const app = initializeApp({
    apiKey:            env.VITE_FIREBASE_API_KEY,
    authDomain:        env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId:         env.VITE_FIREBASE_PROJECT_ID,
    storageBucket:     env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId:             env.VITE_FIREBASE_APP_ID,
  });

  const db = getFirestore(app);
  const wb = XLSX.utils.book_new();

  for (const col of COLLECTIONS) {
    process.stdout.write(`Fetching ${col.id}... `);
    try {
      const snap = await getDocs(collection(db, col.id));
      const rows = snap.docs.map(d => cleanDoc(d.data()));

      if (rows.length === 0) {
        console.log('(empty, skipped)');
        continue;
      }

      const ws = XLSX.utils.json_to_sheet(rows, { cellDates: true });

      // auto column widths
      const cols = Object.keys(rows[0]);
      ws['!cols'] = cols.map(key => ({
        wch: Math.max(
          key.length,
          ...rows.map(r => String(r[key] ?? '').length)
        ) + 2,
      }));

      XLSX.utils.book_append_sheet(wb, ws, col.sheet);
      console.log(`${rows.length} rows`);
    } catch (err) {
      console.log(`ERROR: ${err.message}`);
    }
  }

  const exportsDir = join(ROOT, 'exports');
  if (!existsSync(exportsDir)) mkdirSync(exportsDir);

  const filename = `Shoham_Export_${todayStr()}.xlsx`;
  const outPath = join(exportsDir, filename);
  XLSX.writeFile(wb, outPath);

  console.log(`\nSaved: exports/${filename}`);
}

main().catch(err => {
  console.error('Export failed:', err);
  process.exit(1);
});
