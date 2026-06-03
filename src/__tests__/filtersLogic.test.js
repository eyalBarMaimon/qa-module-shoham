import { describe, it, expect } from 'vitest';
import { formatDate } from '../utils/dateUtils';

// Inline calcNextDate as it appears in Filters.jsx
import { parseDate } from '../utils/dateUtils';

function calcNextDate(lastDateStr, frequency) {
  if (!lastDateStr || !frequency) return '';
  if (['לא נדרש', 'לא בשימוש', '-', ''].includes(String(frequency).trim())) return '';
  const d = parseDate(lastDateStr);
  if (!d) return '';
  const next = new Date(d);
  next.setDate(next.getDate() + 90);
  return formatDate(next);
}

function toISO(ddmmyyyy) {
  if (!ddmmyyyy) return '';
  const parts = ddmmyyyy.split('/');
  if (parts.length !== 3) return '';
  return `${parts[2]}-${parts[1]}-${parts[0]}`;
}

function toDisplay(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  if (!y || !m || !d) return '';
  return `${d}/${m}/${y}`;
}

describe('calcNextDate', () => {
  it('adds 90 days to last date', () => {
    expect(calcNextDate('01/01/2025', 'רבעוני')).toBe('01/04/2025');
  });

  it('returns empty for inactive frequency', () => {
    expect(calcNextDate('01/01/2025', 'לא נדרש')).toBe('');
    expect(calcNextDate('01/01/2025', 'לא בשימוש')).toBe('');
    expect(calcNextDate('01/01/2025', '-')).toBe('');
    expect(calcNextDate('01/01/2025', '')).toBe('');
  });

  it('returns empty when lastDate is empty', () => {
    expect(calcNextDate('', 'רבעוני')).toBe('');
    expect(calcNextDate(null, 'רבעוני')).toBe('');
  });

  it('returns empty when frequency is null', () => {
    expect(calcNextDate('01/01/2025', null)).toBe('');
  });

  it('returns empty for invalid date string', () => {
    expect(calcNextDate('not-a-date', 'רבעוני')).toBe('');
  });

  it('handles month boundary correctly (end of month)', () => {
    // 01/11/2024 + 90 days = 30/01/2025
    expect(calcNextDate('01/11/2024', 'רבעוני')).toBe('30/01/2025');
  });
});

describe('toISO', () => {
  it('converts DD/MM/YYYY to YYYY-MM-DD', () => {
    expect(toISO('15/06/2025')).toBe('2025-06-15');
  });

  it('returns empty for null/undefined', () => {
    expect(toISO('')).toBe('');
    expect(toISO(null)).toBe('');
  });

  it('returns empty for wrong format (no slashes)', () => {
    expect(toISO('2025-06-15')).toBe('');
  });

  it('returns empty for partial format', () => {
    expect(toISO('15/06')).toBe('');
  });
});

describe('toDisplay', () => {
  it('converts YYYY-MM-DD to DD/MM/YYYY', () => {
    expect(toDisplay('2025-06-15')).toBe('15/06/2025');
  });

  it('returns empty for null/empty', () => {
    expect(toDisplay('')).toBe('');
    expect(toDisplay(null)).toBe('');
  });

  it('returns empty for malformed input (no dashes)', () => {
    expect(toDisplay('15/06/2025')).toBe('');
  });
});
