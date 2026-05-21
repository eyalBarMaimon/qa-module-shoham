import { useState, useMemo } from 'react';
import { parseDate } from '../utils/dateUtils';

const DATE_FIELDS = ['תאריך בדיקה', 'מועד הבא', 'תאריך כיול', 'תאריך אחרון', 'תוקף עד'];
const STATUS_ORDER = { red: 0, amber: 1, green: 2, gray: 3 };

export function useSortable(rows) {
  const [sort, setSort] = useState({ col: null, dir: 'asc' });

  function toggleSort(col) {
    setSort(prev => {
      if (prev.col !== col) return { col, dir: 'asc' };
      if (prev.dir === 'asc') return { col, dir: 'desc' };
      return { col: null, dir: 'asc' };
    });
  }

  const sorted = useMemo(() => {
    if (!sort.col) return rows;
    return [...rows].sort((a, b) => {
      const va = a[sort.col] ?? '';
      const vb = b[sort.col] ?? '';
      let cmp;
      if (sort.col === '_status') {
        const oa = STATUS_ORDER[va] ?? 4, ob = STATUS_ORDER[vb] ?? 4;
        cmp = oa - ob;
      } else if (DATE_FIELDS.includes(sort.col)) {
        const da = parseDate(String(va));
        const db = parseDate(String(vb));
        if (!da && !db) cmp = 0;
        else if (!da) cmp = 1;
        else if (!db) cmp = -1;
        else cmp = da - db;
      } else {
        cmp = String(va).localeCompare(String(vb), 'he');
      }
      return sort.dir === 'asc' ? cmp : -cmp;
    });
  }, [rows, sort]);

  return { sorted, sort, toggleSort };
}
