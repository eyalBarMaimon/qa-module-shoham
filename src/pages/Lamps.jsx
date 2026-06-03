import { useEffect, useState, useMemo } from 'react';
import DocHeader from '../components/DocHeader';
import { useCollection } from '../hooks/useCollection';
import { exportTablePDF } from '../utils/exportPDF';
import { todayFormatted } from '../utils/dateUtils';

const DEFAULT_LAMPS = [
  { 'שם המכונה': 'AL 120',   'מ. סידורי מכונה': '10620211', 'סוג מנורה': '', 'תאריך החלפה': '', 'כמות פולסים': '', 'הערות': '' },
  { 'שם המכונה': 'AL IN 150','מ. סידורי מכונה': '20340721', 'סוג מנורה': '', 'תאריך החלפה': '', 'כמות פולסים': '', 'הערות': '' },
  { 'שם המכונה': 'WSD 150',  'מ. סידורי מכונה': '12072020', 'סוג מנורה': '', 'תאריך החלפה': '', 'כמות פולסים': '', 'הערות': '' },
  { 'שם המכונה': 'LMC 180',  'מ. סידורי מכונה': '0014618',  'סוג מנורה': '', 'תאריך החלפה': '', 'כמות פולסים': '', 'הערות': '' },
  { 'שם המכונה': 'ALS 100',  'מ. סידורי מכונה': '04100713', 'סוג מנורה': '', 'תאריך החלפה': '', 'כמות פולסים': '', 'הערות': '' },
];

const COLS = ['שם המכונה', 'מ. סידורי מכונה', 'סוג מנורה', 'תאריך החלפה', 'כמות פולסים', 'הערות'];
const HIST_COLS = ['סוג מנורה', 'תאריך החלפה', 'כמות פולסים', 'הערות'];

// ── History dialog ─────────────────────────────────────────────────────────────
function LampHistoryDialog({ lamp, historyCol, onClose }) {
  const records = useMemo(() =>
    [...historyCol.data]
      .filter(r => r.lamp_id === lamp._id)
      .sort((a, b) => (b.recordedAt || '').localeCompare(a.recordedAt || '')),
    [historyCol.data, lamp._id]
  );

  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col" dir="rtl" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center px-5 py-3 border-b border-gray-200">
          <div>
            <div className="font-bold text-base">{lamp['שם המכונה']}</div>
            <div className="text-xs text-gray-500">מ. סידורי: {lamp['מ. סידורי מכונה']}</div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-3">
          <div className="font-semibold text-sm mb-2">היסטוריית החלפות</div>
          {historyCol.loading && <div className="text-gray-400 text-sm">טוען...</div>}
          {!historyCol.loading && records.length === 0 && (
            <div className="text-gray-400 text-sm">אין החלפות קודמות — נרשמות בכל שמירה</div>
          )}
          {records.length > 0 && (
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-100 text-right">
                  {HIST_COLS.map(c => (
                    <th key={c} className="border border-gray-200 px-3 py-1.5 font-semibold">{c}</th>
                  ))}
                  <th className="border border-gray-200 px-3 py-1.5 font-semibold">נרשם בתאריך</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r, i) => (
                  <tr key={r._id || i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    {HIST_COLS.map(c => (
                      <td key={c} className="border border-gray-200 px-3 py-1.5">{r[c] || '—'}</td>
                    ))}
                    <td className="border border-gray-200 px-3 py-1.5 text-gray-400 text-xs" dir="ltr">
                      {r.recordedAt ? new Date(r.recordedAt).toLocaleDateString('he-IL') : '—'}
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
export default function Lamps() {
  const lampsCol   = useCollection('Lamps');
  const historyCol = useCollection('LampsHistory');
  const [rows, setRows]       = useState(DEFAULT_LAMPS);
  const [editing, setEditing] = useState({});
  const [historyLamp, setHistoryLamp] = useState(null);

  useEffect(() => {
    lampsCol.fetchSheet();
    historyCol.fetchSheet();
  }, []);

  useEffect(() => {
    if (lampsCol.data.length > 0) setRows(lampsCol.data);
  }, [lampsCol.data]);

  function handleEdit(i, field, val) {
    setRows(prev => prev.map((r, idx) => idx === i ? { ...r, [field]: val } : r));
    setEditing(e => ({ ...e, [i]: true }));
  }

  async function handleSave(i) {
    const r = rows[i];
    if (r._id) {
      // Archive current state before overwriting
      const prev = lampsCol.data.find(d => d._id === r._id);
      if (prev) {
        await historyCol.appendRow({
          lamp_id:          r._id,
          'שם המכונה':      prev['שם המכונה']      || '',
          'מ. סידורי מכונה': prev['מ. סידורי מכונה'] || '',
          'סוג מנורה':      prev['סוג מנורה']      || '',
          'תאריך החלפה':    prev['תאריך החלפה']    || '',
          'כמות פולסים':    prev['כמות פולסים']    || '',
          'הערות':          prev['הערות']          || '',
          recordedAt:       new Date().toISOString(),
        });
      }
      await lampsCol.updateRow(r._id, r);
    } else {
      await lampsCol.appendRow(r);
    }
    setEditing(e => { const n = { ...e }; delete n[i]; return n; });
    lampsCol.fetchSheet();
    historyCol.fetchSheet();
  }

  function addRow() {
    setRows(prev => [...prev, { 'שם המכונה': '', 'מ. סידורי מכונה': '', 'סוג מנורה': '', 'תאריך החלפה': todayFormatted(), 'כמות פולסים': '', 'הערות': '' }]);
  }

  async function removeRow(i) {
    const r = rows[i];
    if (!window.confirm('למחוק שורה זו?')) return;
    if (r._id) await lampsCol.deleteRow(r._id);
    setRows(prev => prev.filter((_, idx) => idx !== i));
  }

  return (
    <div>
      <DocHeader tab="lamps" />
      <div className="flex justify-between mb-3">
        <button onClick={addRow} className="bg-green-600 text-white px-4 py-1.5 rounded text-sm hover:bg-green-700">
          + הוסף שורה
        </button>
        <button
          onClick={() => exportTablePDF('lamps', COLS, rows.map(r => COLS.map(c => r[c] ?? '')))}
          className="bg-blue-600 text-white px-4 py-1.5 rounded text-sm hover:bg-blue-700"
        >
          ייצוא PDF
        </button>
      </div>
      {lampsCol.loading && <div className="text-center text-gray-400 py-4">טוען...</div>}
      {lampsCol.error && <div className="text-red-500 text-sm mb-3">{lampsCol.error}</div>}
      <div className="overflow-x-auto">
      <table className="w-full min-w-[700px] text-sm border-collapse">
        <thead>
          <tr className="bg-[#D9D9D9] text-right">
            {COLS.map(c => <th key={c} className="border border-[#999] px-3 py-2 font-bold whitespace-nowrap">{c}</th>)}
            <th className="border border-[#999] px-2 py-2">פעולות</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-[#FAFAFA]'}>
              {COLS.map(c => (
                <td key={c} className="border border-[#999] px-1 py-1">
                  <input
                    value={r[c] ?? ''}
                    onChange={e => handleEdit(i, c, e.target.value)}
                    className="w-full bg-transparent px-2 py-0.5 focus:outline-none focus:bg-blue-50 rounded"
                  />
                </td>
              ))}
              <td className="border border-[#999] px-2 py-1 text-center whitespace-nowrap">
                <div className="flex flex-col items-center gap-1">
                  {editing[i] && (
                    <button onClick={() => handleSave(i)} className="text-green-700 text-xs hover:underline">שמור</button>
                  )}
                  {r._id && (
                    <button
                      onClick={() => { setHistoryLamp(r); historyCol.fetchSheet(); }}
                      className="text-blue-600 text-xs hover:underline"
                    >
                      היסטוריה
                    </button>
                  )}
                  <button onClick={() => removeRow(i)} className="text-red-400 text-xs hover:text-red-600 hover:underline">מחק</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>

      {historyLamp && (
        <LampHistoryDialog
          lamp={historyLamp}
          historyCol={historyCol}
          onClose={() => setHistoryLamp(null)}
        />
      )}
    </div>
  );
}
