import { describe, it, expect } from 'vitest';
import { latestUpdate } from '../utils/dateUtils';

describe('latestUpdate', () => {
  it('returns null for empty array', () => {
    expect(latestUpdate([])).toBeNull();
  });

  it('returns null when all records are baseline (2000-01-01)', () => {
    expect(latestUpdate([
      { recordedAt: '2000-01-01T00:00:00.000Z' },
      { recordedAt: '2000-01-01T00:00:00.000Z' },
    ])).toBeNull();
  });

  it('returns null when all recordedAt fields are empty', () => {
    expect(latestUpdate([{ recordedAt: '' }, { recordedAt: null }])).toBeNull();
  });

  it('returns the latest date formatted in he-IL locale', () => {
    const result = latestUpdate([
      { recordedAt: '2025-01-15T10:00:00.000Z' },
      { recordedAt: '2025-06-20T10:00:00.000Z' },
      { recordedAt: '2024-12-01T10:00:00.000Z' },
    ]);
    // Should be 20/6/2025 in he-IL
    expect(result).toBe(new Date('2025-06-20T10:00:00.000Z').toLocaleDateString('he-IL'));
  });

  it('ignores baseline rows and returns real latest', () => {
    const result = latestUpdate([
      { recordedAt: '2000-01-01T00:00:00.000Z' },
      { recordedAt: '2025-03-10T08:00:00.000Z' },
    ]);
    expect(result).toBe(new Date('2025-03-10T08:00:00.000Z').toLocaleDateString('he-IL'));
  });

  it('supports custom field name', () => {
    const result = latestUpdate([
      { confirmedAt: '2025-05-01T00:00:00.000Z' },
      { confirmedAt: '2025-09-01T00:00:00.000Z' },
    ], 'confirmedAt');
    expect(result).toBe(new Date('2025-09-01T00:00:00.000Z').toLocaleDateString('he-IL'));
  });

  it('returns single valid record', () => {
    const result = latestUpdate([{ recordedAt: '2025-04-01T00:00:00.000Z' }]);
    expect(result).toBe(new Date('2025-04-01T00:00:00.000Z').toLocaleDateString('he-IL'));
  });

  it('handles missing field gracefully (treats as empty)', () => {
    expect(latestUpdate([{ someOtherField: 'abc' }])).toBeNull();
  });
});
