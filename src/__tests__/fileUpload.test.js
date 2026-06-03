import { describe, it, expect } from 'vitest';
import { buildFileName } from '../utils/fileUpload';

describe('buildFileName', () => {
  it('builds correct filename from valid ISO date and identifier', () => {
    expect(buildFileName('2025-06-15', 'SN12345')).toBe('20250615_SN12345');
  });

  it('strips non-alphanumeric chars from identifier', () => {
    expect(buildFileName('2025-06-15', 'SN/123 456')).toBe('20250615_SN123456');
  });

  it('uses NA when date is empty', () => {
    expect(buildFileName('', 'SN123')).toBe('NA_SN123');
  });

  it('uses NA when date is null', () => {
    expect(buildFileName(null, 'SN123')).toBe('NA_SN123');
  });

  it('uses NA when date is malformed (no dashes)', () => {
    expect(buildFileName('15/06/2025', 'SN123')).toBe('NA_SN123');
  });

  it('handles empty identifier', () => {
    expect(buildFileName('2025-06-15', '')).toBe('20250615_');
  });

  it('handles null identifier', () => {
    expect(buildFileName('2025-06-15', null)).toBe('20250615_');
  });

  it('handles Hebrew characters in identifier (strips them)', () => {
    expect(buildFileName('2025-06-15', 'מכונהAL120')).toBe('20250615_AL120');
  });
});
