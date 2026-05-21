import { readFileSync, mkdirSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import * as XLSX from 'xlsx';

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  // חפש .env.local בתיקייה הזו
  const localPath = join(__dirname, '.env.local');
  if (existsSync(localPath)) return parseEnv(localPath);

  // fallback: תיקיית הפרויקט (רמה מעל)
  const parentPath = join(__dirname, '..', '.env.local');
  if (existsSync(parentPath)) return parseEnv(parentPath);

  console.error('ERROR: לא נמצא קובץ .env.local');
  console.error('העתק את .env.local לתוך תיקיית BACKUP');
  process.exit(1);
}

function parseEnv(path) {
  return Object.fromEntries(
    readFileSync(path, 'utf8')
      .split('\n')
      .filter(l => l && !l.startsWith('#') && l.includes('='))
      .map(l => {
        const idx = l.indexOf('=');
        return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()];
      })
  );
}

const COLLECTIONS = [
  { id: 'Tools',            sheet: 'כלי מדידה' },
  { id: 'ToolsHistory',     sheet: 'היסטוריה - כלי מדידה' },
  { id: 'Machines',         sheet: 'מכונות' },
  { id: 'MachinesHistory',  sheet: 'היסטוריה - מכונות' },
  { id: 'Filters',          sheet: 'פילטרים' },
  { id: 'FiltersHistory',   sheet: 'היסטוריה - פילטרים' },
  { id: 'Lamps',            sheet: 'מנורות' },
  { id: 'LampsHistory',     sheet: 'היסטוריה - מנורות' },
  { id: 'Suppliers',        sheet: 'ספקים' },
  { id: 'SuppliersHistory', sheet: 'היסטוריה - ספקים' },
  { id: 'Training',         sheet: 'הדרכות' },
  { id: 'TrainingHistory',  sheet: 'היסטוריה - הדרכות' },
  { id: 'Employees',        sheet: 'עובדים' },
];

function cleanDoc(data) {
  const { _status, ...rest } = data;
  return Object.fromEntries(
    Object.entries(rest).map(([k, v]) => [
      k,
      Array.isArray(v) ? v.join(', ') : v ?? '',
    ])
  );
}

function todayStr() {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}-${mm}-${d.getFullYear()}`;
}

async function main() {
  console.log('=== ייצוא נתונים ל-Excel ===\n');

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
    process.stdout.write(`מושך ${col.id}... `);
    try {
      const snap = await getDocs(collection(db, col.id));
      const rows = snap.docs.map(d => cleanDoc(d.data()));

      if (rows.length === 0) {
        console.log('(ריק, דולג)');
        continue;
      }

      const ws = XLSX.utils.json_to_sheet(rows, { cellDates: true });
      const cols = Object.keys(rows[0]);
      ws['!cols'] = cols.map(key => ({
        wch: Math.max(key.length, ...rows.map(r => String(r[key] ?? '').length)) + 2,
      }));

      XLSX.utils.book_append_sheet(wb, ws, col.sheet);
      console.log(`${rows.length} רשומות`);
    } catch (err) {
      console.log(`שגיאה: ${err.message}`);
    }
  }

  const exportsDir = join(__dirname, 'exports');
  if (!existsSync(exportsDir)) mkdirSync(exportsDir);

  const filename = `Shoham_Export_${todayStr()}.xlsx`;
  XLSX.writeFile(wb, join(exportsDir, filename));

  console.log(`\nנשמר: exports\\${filename}`);
}

main().catch(err => {
  console.error('\nשגיאה:', err.message);
  process.exit(1);
});
