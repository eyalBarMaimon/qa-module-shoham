const UPLOAD_TIMEOUT_MS = 30000;
const GH_OWNER = 'eyalBarMaimon';
const GH_REPO  = 'qa-module-shoham';

// Builds filename: YYYYMMDD_serialnumber
export function buildFileName(dateISO, identifier) {
  const [y, m, d] = (dateISO || '').split('-');
  const dateStr = (y && m && d) ? `${y}${m}${d}` : 'NA';
  const cleanId = String(identifier || '').replace(/[^a-zA-Z0-9]/g, '');
  return `${dateStr}_${cleanId}`;
}

function withTimeout(promise, ms) {
  const timer = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('העלאה נכשלה — timeout. בדוק שהתחברת לאינטרנט.')), ms)
  );
  return Promise.race([promise, timer]);
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload  = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
  });
}

// Uploads to GitHub repo qa-module-shoham under Scanned_Doc/
// Returns a raw.githubusercontent.com URL (permanently public)
export async function uploadScanedDoc(file, category, folderName, fileName) {
  const token = import.meta.env.VITE_GITHUB_TOKEN;

  const cleanFolder = String(folderName || '')
    .replace(/[^a-zA-Z0-9א-ת_-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');

  const ext  = file.name.split('.').pop().toLowerCase();
  const path = `Scanned_Doc/${category}/${cleanFolder}/${fileName}.${ext}`;
  const url  = `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${path}`;

  const uploadPromise = (async () => {
    const base64 = await fileToBase64(file);

    // If file already exists we need its SHA to overwrite
    let sha;
    const check = await fetch(url, { headers: { Authorization: `token ${token}` } });
    if (check.ok) sha = (await check.json()).sha;

    const body = { message: `Add scaned doc: ${path}`, content: base64 };
    if (sha) body.sha = sha;

    const res = await fetch(url, {
      method: 'PUT',
      headers: { Authorization: `token ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `העלאה נכשלה (${res.status})`);
    }

    return `https://raw.githubusercontent.com/${GH_OWNER}/${GH_REPO}/main/${path}`;
  })();

  return withTimeout(uploadPromise, UPLOAD_TIMEOUT_MS);
}
