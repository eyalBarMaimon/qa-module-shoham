import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';

// Builds filename: DDMMYYYY_serialnumber.ext
// e.g. 15062026_B21019951.pdf
export function buildFileName(dateISO, identifier, file) {
  const [y, m, d] = (dateISO || '').split('-');
  const dateStr = (d && m && y) ? `${d}${m}${y}` : 'NA';
  const cleanId = String(identifier || '').replace(/[^a-zA-Z0-9]/g, '');
  const ext = file.name.split('.').pop().toLowerCase();
  return `${dateStr}_${cleanId}.${ext}`;
}

// Uploads to: calibrations/{category}/{folderName}/{fileName}
// e.g. calibrations/tools/AL120/15062026_B21019951.pdf
export async function uploadCalibrationFile(file, category, folderName, fileName) {
  const cleanFolder = String(folderName || '').replace(/[^a-zA-Z0-9֐-׿ _-]/g, '').trim();
  const path = `calibrations/${category}/${cleanFolder}/${fileName}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}
