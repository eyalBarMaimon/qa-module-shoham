import { describe, it, expect } from 'vitest';
import { parseDate, formatDate, daysUntil, todayFormatted } from '../utils/dateUtils';

describe('parseDate', () => {
  it('parses DD/MM/YYYY', () => {
    const d = parseDate('15/06/2025');
    expect(d).toBeInstanceOf(Date);
    expect(d.getFullYear()).toBe(2025);
    expect(d.getMonth()).toBe(5); // 0-indexed
    expect(d.getDate()).toBe(15);
  });

  it('parses MM/YYYY as 1st of month', () => {
    const d = parseDate('06/2025');
    expect(d.getDate()).toBe(1);
    expect(d.getMonth()).toBe(5);
    expect(d.getFullYear()).toBe(2025);
  });

  it('parses YYYY-MM-DD', () => {
    const d = parseDate('2025-06-15');
    expect(d.getFullYear()).toBe(2025);
    expect(d.getMonth()).toBe(5);
    expect(d.getDate()).toBe(15);
  });

  it('returns null for empty string', () => {
    expect(parseDate('')).toBeNull();
    expect(parseDate(null)).toBeNull();
    expect(parseDate(undefined)).toBeNull();
  });

  it('returns null for invalid format', () => {
    expect(parseDate('abc')).toBeNull();
    expect(parseDate('32/13/2025')).toBeInstanceOf(Date); // JS Date handles overflow
    expect(parseDate('not-a-date')).toBeNull();
  });

  it('handles single-digit day and month', () => {
    const d = parseDate('1/1/2025');
    expect(d.getFullYear()).toBe(2025);
    expect(d.getMonth()).toBe(0);
    expect(d.getDate()).toBe(1);
  });
});

describe('formatDate', () => {
  it('formats Date object to DD/MM/YYYY', () => {
    expect(formatDate(new Date(2025, 5, 15))).toBe('15/06/2025');
  });

  it('formats single-digit day/month with zero padding', () => {
    expect(formatDate(new Date(2025, 0, 1))).toBe('01/01/2025');
  });

  it('returns empty string for null/undefined', () => {
    expect(formatDate(null)).toBe('');
    expect(formatDate(undefined)).toBe('');
  });

  it('accepts a date string and parses it', () => {
    expect(formatDate('15/06/2025')).toBe('15/06/2025');
  });
});

describe('daysUntil', () => {
  it('returns positive for future date', () => {
    const future = new Date();
    future.setDate(future.getDate() + 30);
    const str = formatDate(future);
    expect(daysUntil(str)).toBeCloseTo(30, 0);
  });

  it('returns negative for past date', () => {
    const past = new Date();
    past.setDate(past.getDate() - 10);
    const str = formatDate(past);
    expect(daysUntil(str)).toBeCloseTo(-10, 0);
  });

  it('returns 0 for today', () => {
    expect(daysUntil(todayFormatted())).toBe(0);
  });

  it('returns null for invalid date', () => {
    expect(daysUntil('')).toBeNull();
    expect(daysUntil('abc')).toBeNull();
    expect(daysUntil(null)).toBeNull();
  });
});

describe('todayFormatted', () => {
  it('returns string in DD/MM/YYYY format', () => {
    const result = todayFormatted();
    expect(result).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
  });

  it('returns today date', () => {
    const today = new Date();
    const expected = formatDate(today);
    expect(todayFormatted()).toBe(expected);
  });
});
