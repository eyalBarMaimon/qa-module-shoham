/**
 * One-time import: reads F-7.6.1 Tool Calibrating Log REV02.docx → Firebase Firestore (Tools collection)
 * Usage:
 *   node scripts/import-tools.mjs --dry-run   ← preview only
 *   node scripts/import-tools.mjs             ← import to Firebase
 *
 * Requires .env.local with VITE_FIREBASE_API_KEY and VITE_FIREBASE_PROJECT_ID
 */

import mammoth from 'mammoth';
import * as cheerio from 'cheerio';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const isDryRun = process.argv.includes('--dry-run');

// ── Load env ──────────────────────────────────────────────────────────────────
function loadEnv(filePath) {
  try {
    return Object.fromEntries(
      readFileSync(filePath, 'utf8')
        .split('\n')
        .filter(l => l.includes('=') && !l.startsWith('#'))
        .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; })
    );
  } catch { return {}; }
}

const env = { ...loadEnv(resolve(__dir, '../.env.local')), ...loadEnv(resolve(__dir, '../.env')) };
const API_KEY    = env.VITE_FIREBASE_API_KEY;
const PROJECT_ID = env.VITE_FIREBASE_PROJECT_ID;

if (!isDryRun && (!API_KEY || !PROJECT_ID)) {
  console.error('\n❌  Missing credentials. Create .env.local with:');
  console.error('    VITE_FIREBASE_API_KEY=...');
  console.error('    VITE_FIREBASE_PROJECT_ID=...\n');
  process.exit(1);
}

// ── Parse docx ────────────────────────────────────────────────────────────────
const docxPath = resolve(__dir, '../../word_docs/F-7.6.1 Tool Calibrating Log REV02.docx');
console.log('📄  Reading:', docxPath);

const { value: html } = await mammoth.convertToHtml({ path: docxPath });
const $ = cheerio.load(html);

const allRows = [];
$('table tr').each((_, tr) => {
  const cells = $(tr).find('td, th').map((_, td) => $(td).text().trim()).get();
  if (cells.length > 0) allRows.push(cells);
});

if (allRows.length === 0) {
  console.error('❌  No table found in the document.');
  process.exit(1);
}

// ── Find header row ───────────────────────────────────────────────────────────
let headerIdx = -1;
let headers = [];
for (let i = 0; i < Math.min(allRows.length, 5); i++) {
  const row = allRows[i];
  const text = row.join('');
  if (text.includes('שם המכשיר') || text.includes('שם הכלי') || text.includes('תאריך בדיקה')) {
    headerIdx = i;
    headers = row;
    break;
  }
}

if (headerIdx === -1) {
  headerIdx = 0;
  headers = allRows[0];
}

console.log('\n📋  Columns found:', headers.join(' | '));

// ── Map column names → field names ────────────────────────────────────────────
function mapHeader(h) {
  const s = h.trim();
  if (s === '#' || s === 'מספר' || s === 'מס' || s === 'מס\'') return '#';
  // Lab name must be checked BEFORE generic שם check
  if (s.includes('מעבדה')) return 'שם המעבדה';
  if (s.includes('שם') && (s.includes('מכשיר') || s.includes('כלי') || s.includes('ציוד'))) return 'שם המכשיר';
  if (s === 'שם') return 'שם המכשיר';
  if (s.includes('סידורי')) return 'מספר סידורי';
  if (s.includes('תאריך') && (s.includes('בדיקה') || s.includes('כיול'))) return 'תאריך בדיקה';
  if (s.includes('תאריך')) return 'תאריך בדיקה';
  if (s.includes('מועד') || s.includes('הבא')) return 'מועד הבא';
  if (s.includes('מיקום')) return 'מיקום';
  if (s.includes('תדירות')) return 'תדירות כיול';
  if (s.includes('תחום') || s.includes('מדידה')) return 'תחום מדידה';
  if (s.includes('דיוק')) return 'דיוק';
  if (s.includes('הערה')) return 'הערות';
  return s;
}

const fieldNames = headers.map(mapHeader);
console.log('🔑  Field mapping:', fieldNames.join(' | '));

// ── Header repeat detection: set of "header-like" values ─────────────────────
const headerSignature = new Set(headers.map(h => h.trim()).filter(Boolean));

function isHeaderRepeat(row) {
  const matches = row.filter(c => headerSignature.has(c.trim())).length;
  return matches >= 3;
}

const INACTIVE = ['לא בשימוש', 'לא נדרש כיול', 'לא נדרש', 'NA', '-'];

// ── Clean date/status value ───────────────────────────────────────────────────
function cleanDate(val) {
  if (!val) return val;
  // If starts with an inactive keyword, return just the keyword
  for (const kw of INACTIVE) {
    if (val.startsWith(kw)) return kw;
  }
  // Extract DD/MM/YYYY or MM/YYYY if mixed with text
  const match = val.match(/\d{2}\/\d{2}\/\d{4}|\d{2}\/\d{4}/);
  if (match && match[0] !== val) return match[0];
  return val;
}

const SIGNATURE_PATTERNS = ['Date', 'Role', 'Manager', 'QC', 'QA Manager'];
function isSignatureRow(obj) {
  const name = obj['שם המכשיר'] || '';
  const serial = obj['מספר סידורי'] || '';
  return SIGNATURE_PATTERNS.some(p => name.includes(p) || serial.includes(p));
}

// ── Parse data rows ───────────────────────────────────────────────────────────
const tools = [];
let rowNum = 0;
for (let i = headerIdx + 1; i < allRows.length; i++) {
  const row = allRows[i];
  if (row.every(c => c === '')) continue;
  if (isHeaderRepeat(row)) continue;

  const obj = {};
  fieldNames.forEach((field, j) => {
    let val = (row[j] || '').trim();
    if (field === 'מועד הבא' || field === 'תאריך בדיקה') val = cleanDate(val);
    obj[field] = val;
  });

  const name = obj['שם המכשיר'] || '';
  const serial = obj['מספר סידורי'] || '';

  // Skip rows that are clearly not data
  if (!name && !serial) continue;
  if (name === 'שם המכשיר' || name === 'שם הכלי') continue;
  if (isSignatureRow(obj)) continue;

  // Auto-assign # if missing
  if (!obj['#']) { rowNum++; obj['#'] = String(rowNum); }
  else { rowNum = parseInt(obj['#']) || rowNum + 1; }

  tools.push(obj);
}

console.log(`\n✅  Parsed ${tools.length} tools\n`);
const nameWidth = Math.max(...tools.map(t => (t['שם המכשיר'] || '').length), 20);
tools.forEach((t, i) => {
  const name   = (t['שם המכשיר'] || '—').padEnd(nameWidth);
  const serial = (t['מספר סידורי'] || '').padEnd(20);
  const next   = t['מועד הבא'] || '';
  const loc    = t['מיקום'] || '';
  console.log(`  ${String(i + 1).padStart(2)}. ${name} | ${serial} | ${next.padEnd(12)} | ${loc}`);
});

if (isDryRun) {
  console.log('\n🔍  Dry run — nothing written to Firebase.\n');
  process.exit(0);
}

// ── Write to Firestore REST API ───────────────────────────────────────────────
const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

function toFirestoreFields(obj) {
  const fields = {};
  for (const [k, v] of Object.entries(obj)) {
    fields[k] = { stringValue: String(v ?? '') };
  }
  return fields;
}

async function addDoc(collection, data) {
  const url = `${BASE}/${collection}?key=${API_KEY}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: toFirestoreFields(data) }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

console.log('\n🚀  Importing to Firebase (Tools collection)...\n');
let ok = 0, fail = 0;
for (const tool of tools) {
  try {
    await addDoc('Tools', tool);
    console.log(`  ✓ ${tool['שם המכשיר'] || tool['#']}`);
    ok++;
  } catch (e) {
    console.error(`  ✗ ${tool['שם המכשיר'] || tool['#']}: ${e.message}`);
    fail++;
  }
}
console.log(`\n📊  Done: ${ok} imported, ${fail} failed.\n`);
