import { describe, it, expect } from 'vitest';
import {
  STATUS_THRESHOLDS,
  INACTIVE_VALUES,
  TAB_CHAPTERS,
  TAB_SUBJECTS,
} from '../utils/constants';

describe('STATUS_THRESHOLDS', () => {
  it('tools threshold is 60', () => expect(STATUS_THRESHOLDS.tools).toBe(60));
  it('machines threshold is 60', () => expect(STATUS_THRESHOLDS.machines).toBe(60));
  it('suppliers threshold is 90', () => expect(STATUS_THRESHOLDS.suppliers).toBe(90));
  it('filters threshold is 90', () => expect(STATUS_THRESHOLDS.filters).toBe(90));
});

describe('INACTIVE_VALUES', () => {
  it('contains all expected inactive strings', () => {
    const expected = ['לא בשימוש', 'לא נדרש כיול', 'לא נדרש', 'לא נדרש פילטר', 'NA', '-', ''];
    expected.forEach(v => expect(INACTIVE_VALUES).toContain(v));
  });

  it('does not contain common active values', () => {
    expect(INACTIVE_VALUES).not.toContain('01/01/2025');
    expect(INACTIVE_VALUES).not.toContain('רבעוני');
  });
});

describe('TAB_CHAPTERS', () => {
  it('has entry for every tab subject', () => {
    Object.keys(TAB_SUBJECTS).forEach(tab => {
      expect(TAB_CHAPTERS).toHaveProperty(tab);
      expect(typeof TAB_CHAPTERS[tab]).toBe('string');
      expect(TAB_CHAPTERS[tab].length).toBeGreaterThan(0);
    });
  });
});

describe('TAB_SUBJECTS', () => {
  const requiredTabs = ['dashboard', 'tools', 'machines', 'filters', 'lamps', 'suppliers', 'training'];

  it('contains all required tabs', () => {
    requiredTabs.forEach(tab => expect(TAB_SUBJECTS).toHaveProperty(tab));
  });

  it('all subject values are non-empty strings', () => {
    Object.values(TAB_SUBJECTS).forEach(v => {
      expect(typeof v).toBe('string');
      expect(v.length).toBeGreaterThan(0);
    });
  });
});
