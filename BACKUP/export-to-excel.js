import { readFileSync, mkdirSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import * as XLSX from 'xlsx';

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  const localPath = join(__dirname, '.env.local');
  if (existsSync(localPath)) return parseEnv(localPath);

  const parentPath = join(__dirname, '..', '.env.local');
  if (existsSync(parentPath)) return parseEnv(parentPath);

  console.error('ERROR: .env.local file not found.');
  console.error('Copy .env.local into the BACKUP folder and try again.');
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
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}${mm}${dd}`;
}

async function main() {
  console.log('=== Quality Assurance Backup - Excel Export ===\n');

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

      const ws = rows.length > 0
        ? XLSX.utils.json_to_sheet(rows, { cellDates: true })
        : XLSX.utils.aoa_to_sheet([['No data']]);

      if (rows.length > 0) {
        const cols = Object.keys(rows[0]);
        ws['!cols'] = cols.map(key => ({
          wch: Math.max(key.length, ...rows.map(r => String(r[key] ?? '').length)) + 2,
        }));
      }

      XLSX.utils.book_append_sheet(wb, ws, col.sheet);
      console.log(rows.length > 0 ? `${rows.length} rows` : '(empty)');
    } catch (err) {
      console.log(`Error: ${err.message}`);
    }
  }

  const exportsDir = process.argv[2] || 'E:\\Downloads';
  if (!existsSync(exportsDir)) mkdirSync(exportsDir, { recursive: true });

  const filename = `${todayStr()} Quality Assurance Backup.xlsx`;
  XLSX.writeFile(wb, join(exportsDir, filename));

  console.log(`\nSaved: ${exportsDir}\\${filename}`);
}

main().catch(err => {
  console.error('\nExport failed:', err.message);
  process.exit(1);
});
