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
    setTimeout(() => reject(new Error('העלאה נכשלה — timeout. בדוק שהתחברת לאינטרנט.')), ms)
  );
  return Promise.race([promise, timer]);
}

// Uploads to Cloudinary: calibrations/{category}/{folderName}/{fileName}
// Returns the secure URL of the uploaded file
export async function uploadCalibrationFile(file, category, folderName, fileName) {
  const cloudName    = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  const cleanFolder = String(folderName || '')
    .replace(/[^a-zA-Z0-9א-ת_-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');

  // public_id without extension — Cloudinary appends it automatically
  const publicId = `calibrations/${category}/${cleanFolder}/${fileName.replace(/\.[^.]+$/, '')}`;

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);
  formData.append('public_id', publicId);

  const uploadPromise = fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
    { method: 'POST', body: formData }
  ).then(async res => {
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `העלאה נכשלה (${res.status})`);
    }
    const data = await res.json();
    return data.secure_url;
  });

  return withTimeout(uploadPromise, UPLOAD_TIMEOUT_MS);
}
