// Parse DD/MM/YYYY, MM/YYYY, or YYYY-MM-DD → Date object
export function parseDate(str) {
  if (!str || typeof str !== 'string') return null;
  const s = str.trim();
  // DD/MM/YYYY
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(s)) {
    const [d, m, y] = s.split('/');
    return new Date(+y, +m - 1, +d);
  }
  // MM/YYYY (no day — treat as 1st of month)
  if (/^\d{1,2}\/\d{4}$/.test(s)) {
    const [m, y] = s.split('/');
    return new Date(+y, +m - 1, 1);
  }
  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y, m, d] = s.split('-');
    return new Date(+y, +m - 1, +d);
  }
  return null;
}

export function formatDate(date) {
  if (!date) return '';
  const d = date instanceof Date ? date : parseDate(date);
  if (!d) return date;
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

export function daysUntil(dateStr) {
  const d = parseDate(dateStr);
  if (!d) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.floor((d - today) / 86400000);
}

export function todayFormatted() {
  return formatDate(new Date());
}

// Returns the most recent recordedAt (or confirmedAt) from a history collection
// as DD/MM/YYYY, ignoring baseline sentinel rows (2000-01-01).
export function latestUpdate(historyData, field = 'recordedAt') {
  const BASELINE = '2000-01-01';
  const latest = historyData
    .map(r => r[field] || '')
    .filter(r => r && !r.startsWith(BASELINE))
    .sort()
    .at(-1);
  if (!latest) return null;
  return new Date(latest).toLocaleDateString('he-IL');
}
