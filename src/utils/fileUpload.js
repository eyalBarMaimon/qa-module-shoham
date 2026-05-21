import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';

const UPLOAD_TIMEOUT_MS = 20000;

// Builds filename: YYYYMMDD_serialnumber.ext
// e.g. 20260615_B21019951.pdf
export function buildFileName(dateISO, identifier, file) {
  const [y, m, d] = (dateISO || '').split('-');
  const dateStr = (y && m && d) ? `${y}${m}${d}` : 'NA';
  const cleanId = String(identifier || '').replace(/[^a-zA-Z0-9]/g, '');
  const ext = file.name.split('.').pop().toLowerCase();
  return `${dateStr}_${cleanId}.${ext}`;
}

function withTimeout(promise, ms) {
  const timer = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('העלאה נכשלה — timeout. בדוק שהתחברת לאינטרנט ושה-Firebase Storage מופעל.')), ms)
  );
  return Promise.race([promise, timer]);
}

// Uploads to: calibrations/{category}/{folderName}/{fileName}
// e.g. calibrations/tools/AL_120/20260615_B21019951.pdf
export async function uploadCalibrationFile(file, category, folderName, fileName) {
  const cleanFolder = String(folderName || '')
    .replace(/[^a-zA-Z0-9א-ת_-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
  const path = `calibrations/${category}/${cleanFolder}/${fileName}`;
  const storageRef = ref(storage, path);
  await withTimeout(uploadBytes(storageRef, file), UPLOAD_TIMEOUT_MS);
  return withTimeout(getDownloadURL(storageRef), UPLOAD_TIMEOUT_MS);
}
