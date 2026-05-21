import { useEffect, useState, useMemo } from 'react';
import DocHeader from '../components/DocHeader';
import StatusBadge from '../components/StatusBadge';
import SortableHeader from '../components/SortableHeader';
import { useCollection as useSheets } from '../hooks/useCollection';
import { calcFilterStatus } from '../hooks/useStatus';
import { useSortable } from '../hooks/useSortable';
import { exportTablePDF } from '../utils/exportPDF';

function toISO(ddmmyyyy) {
  if (!ddmmyyyy) return '';
  const parts = ddmmyyyy.split('/');
  if (parts.length !== 3) return '';
  return `${parts[2]}-${parts[1]}-${parts[0]}`;
}

function toDisplay(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

// ── Filter update + history dialog ────────────────────────────────────────────
function FilterDialog({ filter, onClose, historyCol, filtersCol, uniqueFreqs }) {
  const history = useMemo(() => {
    const records = [...historyCol.data]
      .filter(r => r.filter_id === filter._id)
      .sort((a, b) => (b.recordedAt || '').localeCompare(a.recordedAt || ''));

    if (records.length === 0 && filter['תאריך אחרון']) {
      return [{
        _baseline: true,
        'תאריך אחרון': filter['תאריך אחרון'],
        'תדירות':      filter['תדירות'] || '—',
        'בוצע על ידי': '—',
        recordedAt: '',
      }];
    }
    return records;
  }, [historyCol.data, filter]);

  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({
    תאריך_אחרון: toISO(filter['תאריך אחרון']) || today,
    תדירות:      filter['תדירות'] || '',
    בוצע_על_ידי: '',
  });
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);

    const realRecords = historyCol.data.filter(r => r.filter_id === filter._id);
    if (realRecords.length === 0 && filter['תאריך אחרון']) {
      await historyCol.appendRow({
        filter_id:      filter._id,
        'מ. פילטר':    filter['מ. פילטר'],
        'תאריך אחרון': filter['תאריך אחרון'],
        'תדירות':      filter['תדירות'] || '—',
        'בוצע על ידי': '—',
        recordedAt:    '2000-01-01T00:00:00.000Z',
      });
    }

    const displayDate = toDisplay(form.תאריך_אחרון);
    await historyCol.appendRow({
      filter_id:      filter._id,
      'מ. פילטר':    filter['מ. פילטר'],
      'תאריך אחרון': displayDate,
      'תדירות':      form.תדירות || '—',
      'בוצע על ידי': form.בוצע_על_ידי || '—',
      recordedAt:    new Date().toISOString(),
    });

    filtersCol.setData(prev => prev.map(r =>
      r._id === filter._id
        ? { ...r, 'תאריך אחרון': displayDate, 'תדירות': form.תדירות }
        : r
    ));
    await filtersCol.updateRow(filter._id, { 'תאריך אחרון': displayDate, 'תדירות': form.תדירות });
    await historyCol.fetchSheet();
    setSaving(false);
    setForm({ תאריך_אחרון: form.תאריך_אחרון, תדירות: form.תדירות, בוצע_על_ידי: '' });
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col" dir="rtl">

        <div className="flex justify-between items-center px-5 py-3 border-b border-gray-200">
          <div>
            <div className="font-bold text-base">פילטר {filter['מ. פילטר']}</div>
            <div className="text-xs text-gray-500">
              {filter['מכונה']} · {filter['מיקום']} · תדירות: {filter['תדירות']}
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
          <div className="font-semibold text-sm mb-3">רישום החלפה / ניקוי</div>
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="text-xs text-gray-500 block mb-1">תאריך ביצוע</label>
              <input type="date" value={form.תאריך_אחרון}
                onChange={e => setForm(f => ({ ...f, תאריך_אחרון: e.target.value }))}
                className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-400" dir="ltr" />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">תדירות</label>
              <input
                list="freq-list"
                value={form.תדירות}
                onChange={e => setForm(f => ({ ...f, תדירות: e.target.value }))}
                placeholder="בחר או כתוב..."
                className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-400 w-36"
              />
              <datalist id="freq-list">
                {uniqueFreqs.map(f => <option key={f} value={f} />)}
              </datalist>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">בוצע על ידי</label>
              <input value={form.בוצע_על_ידי}
                onChange={e => setForm(f => ({ ...f, בוצע_על_ידי: e.target.value }))}
                placeholder="שם המבצע"
                className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-400 w-40" />
            </div>
          </div>
          <button onClick={handleSave} disabled={saving || !form.תאריך_אחרון}
            className="mt-3 bg-blue-600 text-white px-4 py-1.5 rounded text-sm hover:bg-blue-700 disabled:opacity-50">
            {saving ? 'שומר...' : 'שמור'}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-3">
          <div className="font-semibold text-sm mb-2">היסטוריה</div>
          {historyCol.loading && <div className="text-gray-400 text-sm">טוען...</div>}
          {!historyCol.loading && history.length === 0 && (
            <div className="text-gray-400 text-sm">אין רשומות קודמות</div>
          )}
          {history.length > 0 && (
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-100 text-right">
                  <th className="border border-gray-200 px-3 py-1.5 font-semibold">תאריך ביצוע</th>
                  <th className="border border-gray-200 px-3 py-1.5 font-semibold">תדירות</th>
                  <th className="border border-gray-200 px-3 py-1.5 font-semibold">בוצע על ידי</th>
                  <th className="border border-gray-200 px-3 py-1.5 font-semibold">נרשם בתאריך</th>
                </tr>
              </thead>
              <tbody>
                {history.map((r, i) => (
                  <tr key={r._id || i} className={r._baseline ? 'bg-yellow-50' : i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="border border-gray-200 px-3 py-1.5">
                      {r['תאריך אחרון']}
                      {r._baseline && <span className="mr-2 text-xs text-yellow-700">(נתון קיים)</span>}
                    </td>
                    <td className="border border-gray-200 px-3 py-1.5">{r['תדירות']}</td>
                    <td className="border border-gray-200 px-3 py-1.5">{r['בוצע על ידי']}</td>
                    <td className="border border-gray-200 px-3 py-1.5 text-gray-400 text-xs" dir="ltr">
                      {r.recordedAt && r.recordedAt !== '2000-01-01T00:00:00.000Z'
                        ? new Date(r.recordedAt).toLocaleDateString('he-IL')
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function Filters() {
  const filtersCol = useSheets('Filters');
  const historyCol = useSheets('FiltersHistory');
  const [activeFilter, setActiveFilter] = useState(null);

  useEffect(() => {
    filtersCol.fetchSheet();
    historyCol.fetchSheet();
  }, []);

  const uniqueFreqs = useMemo(() =>
    [...new Set(filtersCol.data.map(r => r['תדירות']).filter(Boolean))].sort(),
    [filtersCol.data]);

  const filtered = useMemo(() =>
    filtersCol.data.map(r => ({ ...r, _status: calcFilterStatus(r['תאריך אחרון'], r['תדירות']) })),
    [filtersCol.data]);

  const { sorted: rows, sort, toggleSort } = useSortable(filtered);

  const cols = ['מ. פילטר', 'מכונה', 'מ. מכונה', 'מיקום', 'תדירות', 'תאריך אחרון', 'סטטוס'];

  return (
    <div>
      <DocHeader tab="filters" />
      <div className="flex justify-end mb-3">
        <button
          onClick={() => exportTablePDF('filters', cols, rows.map(r => cols.map(c => c === 'סטטוס' ? r._status : (r[c] ?? ''))))}
          className="bg-blue-600 text-white px-4 py-1.5 rounded text-sm hover:bg-blue-700"
        >
          ייצוא PDF
        </button>
      </div>
      {filtersCol.loading && <div className="text-center text-gray-400 py-4">טוען...</div>}
      {filtersCol.error && <div className="text-red-500 text-sm mb-3">{filtersCol.error}</div>}
      <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-[#D9D9D9] text-right">
            <SortableHeader col="מ. פילטר"     label="מ. פילטר"     sort={sort} onSort={toggleSort} />
            <SortableHeader col="מכונה"         label="מכונה"         sort={sort} onSort={toggleSort} />
            <SortableHeader col="מ. מכונה"     label="מ. מכונה"     sort={sort} onSort={toggleSort} />
            <SortableHeader col="מיקום"         label="מיקום"         sort={sort} onSort={toggleSort} />
            <SortableHeader col="תדירות"        label="תדירות"        sort={sort} onSort={toggleSort} />
            <SortableHeader col="תאריך אחרון"   label="תאריך אחרון"   sort={sort} onSort={toggleSort} />
            <SortableHeader col="_status"       label="סטטוס"         sort={sort} onSort={toggleSort} />
            <th className="border border-[#999] px-2 py-2 font-bold">פעולות</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r._id || i} className={i % 2 === 0 ? 'bg-white' : 'bg-[#FAFAFA]'}>
              <td className="border border-[#999] px-3 py-1.5">{r['מ. פילטר']}</td>
              <td className="border border-[#999] px-3 py-1.5">{r['מכונה']}</td>
              <td className="border border-[#999] px-3 py-1.5">{r['מ. מכונה']}</td>
              <td className="border border-[#999] px-3 py-1.5">{r['מיקום']}</td>
              <td className="border border-[#999] px-3 py-1.5">{r['תדירות']}</td>
              <td className="border border-[#999] px-3 py-1.5">{r['תאריך אחרון']}</td>
              <td className="border border-[#999] px-3 py-1.5"><StatusBadge status={r._status} /></td>
              <td className="border border-[#999] px-2 py-1.5 text-center">
                <button
                  onClick={() => setActiveFilter(r)}
                  className="text-blue-600 text-xs hover:underline whitespace-nowrap"
                >
                  עדכן / היסטוריה
                </button>
              </td>
            </tr>
          ))}
          {rows.length === 0 && !filtersCol.loading && (
            <tr><td colSpan={8} className="text-center py-4 text-gray-400">אין תוצאות</td></tr>
          )}
        </tbody>
      </table>
      </div>

      {activeFilter && (
        <FilterDialog
          filter={activeFilter}
          onClose={() => setActiveFilter(null)}
          historyCol={historyCol}
          filtersCol={filtersCol}
          uniqueFreqs={uniqueFreqs}
        />
      )}
    </div>
  );
}
