import { describe, it, expect } from 'vitest';

// cellLabel logic extracted from exportPDF — tests the status-label mapping
const STATUS_LABELS = { red: 'פג תוקף', amber: 'בקרוב', green: 'תקין', gray: 'לא פעיל' };
function cellLabel(val) {
  return STATUS_LABELS[val] ?? String(val ?? '');
}

describe('cellLabel (PDF cell rendering)', () => {
  it('maps red → פג תוקף', () => expect(cellLabel('red')).toBe('פג תוקף'));
  it('maps amber → בקרוב',  () => expect(cellLabel('amber')).toBe('בקרוב'));
  it('maps green → תקין',   () => expect(cellLabel('green')).toBe('תקין'));
  it('maps gray → לא פעיל', () => expect(cellLabel('gray')).toBe('לא פעיל'));

  it('returns the value as-is for non-status strings', () => {
    expect(cellLabel('01/06/2025')).toBe('01/06/2025');
    expect(cellLabel('שם המכשיר')).toBe('שם המכשיר');
    expect(cellLabel('SN12345')).toBe('SN12345');
  });

  it('returns empty string for null', ()      => expect(cellLabel(null)).toBe(''));
  it('returns empty string for undefined', () => expect(cellLabel(undefined)).toBe(''));
  it('returns empty string for empty string', () => expect(cellLabel('')).toBe(''));

  it('returns numeric values as string', () => {
    expect(cellLabel(42)).toBe('42');
    expect(cellLabel(0)).toBe('0');
  });
});
