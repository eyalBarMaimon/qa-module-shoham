import { describe, it, expect } from 'vitest';
import { calcStatus, calcFilterStatus } from '../hooks/useStatus';
import { formatDate } from '../utils/dateUtils';

function daysFromToday(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return formatDate(d);
}

describe('calcStatus — machines use same 60-day threshold as tools', () => {
  it('green for > 60 days', () => expect(calcStatus(daysFromToday(90), 'machines')).toBe('green'));
  it('amber for <= 60 days', () => expect(calcStatus(daysFromToday(60), 'machines')).toBe('amber'));
  it('red for expired',      () => expect(calcStatus(daysFromToday(-1), 'machines')).toBe('red'));
});

describe('calcStatus — inactive value exhaustive check', () => {
  const inactiveValues = ['לא בשימוש', 'לא נדרש כיול', 'לא נדרש', 'לא נדרש פילטר', 'NA', '-', ''];
  inactiveValues.forEach(val => {
    it(`returns gray for "${val}"`, () => {
      expect(calcStatus(val, 'tools')).toBe('gray');
    });
  });
});

describe('calcStatus — unknown type falls back to 60-day threshold', () => {
  it('green for > 60 days with unknown type', () =>
    expect(calcStatus(daysFromToday(90), 'unknown')).toBe('green'));
  it('amber for 30 days with unknown type', () =>
    expect(calcStatus(daysFromToday(30), 'unknown')).toBe('amber'));
});

describe('calcFilterStatus — boundary conditions', () => {
  it('green when exactly -90 days (boundary, not over)', () => {
    expect(calcFilterStatus(daysFromToday(-90), 'רבעוני')).toBe('green');
  });

  it('amber when -91 days (just over boundary)', () => {
    expect(calcFilterStatus(daysFromToday(-91), 'רבעוני')).toBe('amber');
  });

  it('green when date is today', () => {
    expect(calcFilterStatus(daysFromToday(0), 'רבעוני')).toBe('green');
  });

  it('green when date is in the future', () => {
    expect(calcFilterStatus(daysFromToday(10), 'רבעוני')).toBe('green');
  });

  it('returns gray for all inactive frequencies', () => {
    ['לא נדרש', 'לא בשימוש', '-', '', null].forEach(freq => {
      expect(calcFilterStatus(daysFromToday(-10), freq)).toBe('gray');
    });
  });

  it('amber when lastDate is undefined', () => {
    expect(calcFilterStatus(undefined, 'רבעוני')).toBe('amber');
  });
});
