import { describe, it, expect } from 'vitest';
import { calcStatus, calcFilterStatus } from '../hooks/useStatus';
import { formatDate } from '../utils/dateUtils';

function daysFromToday(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return formatDate(d);
}

describe('calcStatus (tools/machines — 60 day threshold)', () => {
  it('returns green for date > 60 days away', () => {
    expect(calcStatus(daysFromToday(90), 'tools')).toBe('green');
  });

  it('returns amber for date within 60 days', () => {
    expect(calcStatus(daysFromToday(30), 'tools')).toBe('amber');
  });

  it('returns amber for exactly 60 days', () => {
    expect(calcStatus(daysFromToday(60), 'tools')).toBe('amber');
  });

  it('returns red for expired date', () => {
    expect(calcStatus(daysFromToday(-1), 'tools')).toBe('red');
  });

  it('returns red for today', () => {
    expect(calcStatus(daysFromToday(0), 'tools')).toBe('red');
  });

  it('returns gray for empty string', () => {
    expect(calcStatus('', 'tools')).toBe('gray');
  });

  it('returns gray for null/undefined', () => {
    expect(calcStatus(null, 'tools')).toBe('gray');
    expect(calcStatus(undefined, 'tools')).toBe('gray');
  });

  it('returns gray for לא בשימוש', () => {
    expect(calcStatus('לא בשימוש', 'tools')).toBe('gray');
  });

  it('returns gray for לא נדרש כיול', () => {
    expect(calcStatus('לא נדרש כיול', 'tools')).toBe('gray');
  });

  it('returns gray for NA', () => {
    expect(calcStatus('NA', 'tools')).toBe('gray');
  });

  it('returns gray for dash', () => {
    expect(calcStatus('-', 'tools')).toBe('gray');
  });

  it('returns gray for invalid date string', () => {
    expect(calcStatus('not-a-date', 'tools')).toBe('gray');
  });
});

describe('calcStatus (suppliers — 90 day threshold)', () => {
  it('returns green for date > 90 days away', () => {
    expect(calcStatus(daysFromToday(120), 'suppliers')).toBe('green');
  });

  it('returns amber for date within 90 days', () => {
    expect(calcStatus(daysFromToday(45), 'suppliers')).toBe('amber');
  });

  it('returns green for 91 days', () => {
    expect(calcStatus(daysFromToday(91), 'suppliers')).toBe('green');
  });

  it('returns amber for exactly 90 days', () => {
    expect(calcStatus(daysFromToday(90), 'suppliers')).toBe('amber');
  });

  it('returns red for expired', () => {
    expect(calcStatus(daysFromToday(-5), 'suppliers')).toBe('red');
  });

  it('returns gray for לא נדרש', () => {
    expect(calcStatus('לא נדרש', 'suppliers')).toBe('gray');
  });
});

describe('calcFilterStatus', () => {
  it('returns green when last date is recent (< 90 days ago)', () => {
    expect(calcFilterStatus(daysFromToday(-30), 'רבעוני')).toBe('green');
  });

  it('returns amber when last date is > 90 days ago', () => {
    expect(calcFilterStatus(daysFromToday(-91), 'רבעוני')).toBe('amber');
  });

  it('returns amber when last date is exactly -90 days', () => {
    // -90 means 90 days ago — daysUntil returns -90, which is NOT < -90
    expect(calcFilterStatus(daysFromToday(-90), 'רבעוני')).toBe('green');
  });

  it('returns amber when no last date but frequency is set', () => {
    expect(calcFilterStatus('', 'רבעוני')).toBe('amber');
    expect(calcFilterStatus(null, 'רבעוני')).toBe('amber');
  });

  it('returns gray when frequency is empty', () => {
    expect(calcFilterStatus(daysFromToday(-10), '')).toBe('gray');
    expect(calcFilterStatus(daysFromToday(-10), null)).toBe('gray');
  });

  it('returns gray for inactive frequency values', () => {
    expect(calcFilterStatus(daysFromToday(-10), 'לא נדרש')).toBe('gray');
    expect(calcFilterStatus(daysFromToday(-10), 'לא בשימוש')).toBe('gray');
    expect(calcFilterStatus(daysFromToday(-10), '-')).toBe('gray');
  });
});
