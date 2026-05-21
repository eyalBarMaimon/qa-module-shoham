import { useEffect, useState } from 'react';
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

export default function Lamps() {
  const { data, loading, error, fetchSheet, updateRow, appendRow, deleteRow } = useCollection('Lamps');
  const [rows, setRows] = useState(DEFAULT_LAMPS);
  const [editing, setEditing] = useState({});

  useEffect(() => { fetchSheet(); }, []);

  useEffect(() => {
    if (data.length > 0) setRows(data);
  }, [data]);

  function handleEdit(i, field, val) {
    setRows(prev => prev.map((r, idx) => idx === i ? { ...r, [field]: val } : r));
    setEditing(e => ({ ...e, [i]: true }));
  }

  async function handleSave(i) {
    const r = rows[i];
    if (r._id) await updateRow(r._id, r);
    else await appendRow(r);
    setEditing(e => { const n = { ...e }; delete n[i]; return n; });
    fetchSheet();
  }

  function addRow() {
    setRows(prev => [...prev, { 'שם המכונה': '', 'מ. סידורי מכונה': '', 'סוג מנורה': '', 'תאריך החלפה': todayFormatted(), 'כמות פולסים': '', 'הערות': '' }]);
  }

  async function removeRow(i) {
    const r = rows[i];
    if (r._id) await deleteRow(r._id);
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
      {loading && <div className="text-center text-gray-400 py-4">טוען...</div>}
      {error && <div className="text-red-500 text-sm mb-3">{error}</div>}
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-[#D9D9D9] text-right">
            {COLS.map(c => <th key={c} className="border border-[#999] px-3 py-2 font-bold">{c}</th>)}
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
                {editing[i] && (
                  <button onClick={() => handleSave(i)} className="text-green-700 text-xs ml-2 hover:underline">שמור</button>
                )}
                <button onClick={() => removeRow(i)} className="text-red-500 text-xs hover:underline">מחק</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
