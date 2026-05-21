import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import * as XLSX from 'xlsx';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── env ──────────────────────────────────────────────────────────────────────

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

// ─── collections ─────────────────────────────────────────────────────────────

const COLLECTIONS = [
  { id: 'Tools',            sheet: 'כלי מדידה',            cols: ['#','שם המכשיר','מספר סידורי','תחום מדידה','תאריך בדיקה','מועד הבא','מיקום'] },
  { id: 'ToolsHistory',     sheet: 'היסטוריה - כלי מדידה', cols: null },
  { id: 'Machines',         sheet: 'מכונות',               cols: ['מ. מכונה','שם','יצרן','מיקום','תאריך כיול','מועד הבא'] },
  { id: 'MachinesHistory',  sheet: 'היסטוריה - מכונות',    cols: null },
  { id: 'Filters',          sheet: 'פילטרים',              cols: ['מ. פילטר','מכונה','מ. מכונה','מיקום','תדירות','תאריך אחרון'] },
  { id: 'FiltersHistory',   sheet: 'היסטוריה - פילטרים',   cols: null },
  { id: 'Lamps',            sheet: 'מנורות',               cols: ['שם המכונה','מ. סידורי מכונה','סוג מנורה','תאריך החלפה','כמות פולסים','הערות'] },
  { id: 'LampsHistory',     sheet: 'היסטוריה - מנורות',    cols: null },
  { id: 'Suppliers',        sheet: 'ספקים',                cols: ['#','שם ספק','סוג הסמכה','תוקף עד','הערות'] },
  { id: 'SuppliersHistory', sheet: 'היסטוריה - ספקים',     cols: null },
  { id: 'Training',         sheet: 'הדרכות',               cols: ['נושא','מסמכים'] },
  { id: 'TrainingHistory',  sheet: 'היסטוריה - הדרכות',    cols: ['נושא','מסמכים','משתתפים','מדריך','תאריך'] },
  { id: 'Employees',        sheet: 'עובדים',               cols: null },
];

function cleanDoc(data) {
  const { _status, ...rest } = data;
  return Object.fromEntries(
    Object.entries(rest).map(([k, v]) => {
      if (Array.isArray(v)) return [k, v.join(', ')];
      if (v && typeof v === 'object' && typeof v.toDate === 'function')
        return [k, v.toDate().toLocaleDateString('en-GB')];
      return [k, v ?? ''];
    })
  );
}

function todayStr() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm  = String(d.getMonth() + 1).padStart(2, '0');
  const dd  = String(d.getDate()).padStart(2, '0');
  return `${yyyy}${mm}${dd}`;
}

// ─── Excel export ─────────────────────────────────────────────────────────────

async function exportExcel(savePath, db) {
  console.log('=== Quality Assurance Backup - Excel Export ===\n');

  const wb = XLSX.utils.book_new();

  for (const col of COLLECTIONS) {
    process.stdout.write(`Fetching ${col.id}... `);
    try {
      const snap = await getDocs(collection(db, col.id));
      const rawRows = snap.docs.map(d => cleanDoc(d.data()));

      const rows = col.cols && rawRows.length > 0
        ? rawRows.map(row => Object.fromEntries(col.cols.map(c => [c, row[c] ?? ''])))
        : rawRows;

      const ws = rows.length > 0
        ? XLSX.utils.json_to_sheet(rows, { cellDates: true })
        : XLSX.utils.aoa_to_sheet([['No data']]);

      const colKeys = rows.length > 0 ? Object.keys(rows[0]) : [];
      if (colKeys.length > 0) {
        ws['!cols'] = colKeys.map(key => ({
          wch: Math.max(key.length, ...rows.map(r => String(r[key] ?? '').length)) + 2,
        }));
      }

      XLSX.utils.book_append_sheet(wb, ws, col.sheet);
      console.log(rows.length > 0 ? `${rows.length} rows` : '(empty)');
    } catch (err) {
      console.log(`Error: ${err.message}`);
    }
  }

  if (!existsSync(savePath)) mkdirSync(savePath, { recursive: true });

  const filename = `${todayStr()} Quality Assurance Backup.xlsx`;
  XLSX.writeFile(wb, join(savePath, filename));
  console.log(`\nSaved: ${savePath}\\${filename}`);
}

// ─── GitHub Scanned_Doc download ──────────────────────────────────────────────

// Lists all blob paths under a directory using the Contents API (avoids tree truncation).
async function listDir(repoSlug, dirPath, token) {
  const res = await fetch(
    `https://api.github.com/repos/${repoSlug}/contents/${dirPath.split('/').map(encodeURIComponent).join('/')}`,
    { headers: { 'User-Agent': 'qa-backup-script', Authorization: `token ${token}` } }
  );
  if (!res.ok) {
    console.log(`  Warning: GitHub API ${res.status} for ${dirPath}`);
    return [];
  }
  const items = await res.json();
  const blobs = [];
  for (const item of items) {
    if (item.type === 'file') blobs.push(item.path);
    else if (item.type === 'dir') blobs.push(...await listDir(repoSlug, item.path, token));
  }
  return blobs;
}

async function downloadScanedDocs(savePath, repoSlug, token) {
  console.log('\n=== Downloading Scanned_Doc files ===\n');

  const filePaths = await listDir(repoSlug, 'Scanned_Doc', token);
  if (filePaths.length === 0) {
    console.log('No files found under Scanned_Doc/.');
    return;
  }

  let downloaded = 0;
  let skipped    = 0;
  let failed     = 0;

  for (const filePath of filePaths) {
    const localPath = join(savePath, filePath);

    if (existsSync(localPath)) {
      skipped++;
      continue;
    }

    const dir = dirname(localPath);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

    const encodedPath = filePath.split('/').map(encodeURIComponent).join('/');
    const rawUrl = `https://raw.githubusercontent.com/${repoSlug}/main/${encodedPath}`;

    try {
      const res = await fetch(rawUrl, { headers: { 'User-Agent': 'qa-backup-script', Authorization: `token ${token}` } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      writeFileSync(localPath, Buffer.from(await res.arrayBuffer()));
      console.log(`  Downloaded: ${filePath}`);
      downloaded++;
    } catch (err) {
      console.log(`  Failed: ${filePath} — ${err.message}`);
      failed++;
    }
  }

  const failedMsg = failed ? `, ${failed} failed` : '';
  console.log(`\nScanned docs: ${downloaded} new, ${skipped} already exist${failedMsg}`);
}

// ─── main ─────────────────────────────────────────────────────────────────────

async function main() {
  const savePath   = process.argv[2] || 'E:\\Downloads';
  const githubRepo = process.argv[3] || null;

  const env = loadEnv();
  const app = initializeApp({
    apiKey:            env.VITE_FIREBASE_API_KEY,
    authDomain:        env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId:         env.VITE_FIREBASE_PROJECT_ID,
    storageBucket:     env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId:             env.VITE_FIREBASE_APP_ID,
  });

  await exportExcel(savePath, getFirestore(app));

  if (githubRepo) {
    await downloadScanedDocs(savePath, githubRepo, env.VITE_GITHUB_TOKEN);
  }
}

main().catch(err => {
  console.error('\nExport failed:', err.message);
  process.exit(1);
});
