import { useEffect, useMemo } from 'react';
import DocHeader from '../components/DocHeader';
import StatusBadge from '../components/StatusBadge';
import EditableDateCell from '../components/EditableDateCell';
import { useCollection as useSheets } from '../hooks/useCollection';
import { calcFilterStatus } from '../hooks/useStatus';
import { exportTablePDF } from '../utils/exportPDF';

export default function Filters() {
  const { data, loading, error, fetchSheet, updateRow, setData } = useSheets('Filters');

  useEffect(() => { fetchSheet(); }, []);

  const rows = useMemo(() =>
    data.map(r => ({ ...r, _status: calcFilterStatus(r['תאריך אחרון'], r['תדירות']) })),
    [data]);

  async function saveDate(docId, field, newVal) {
    setData(prev => prev.map(r => r._id === docId ? { ...r, [field]: newVal } : r));
    await updateRow(docId, { [field]: newVal });
  }

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
      {loading && <div className="text-center text-gray-400 py-4">טוען...</div>}
      {error && <div className="text-red-500 text-sm mb-3">{error}</div>}
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-[#D9D9D9] text-right">
            {cols.map(c => <th key={c} className="border border-[#999] px-3 py-2 font-bold">{c}</th>)}
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
              <td className="border border-[#999] px-2 py-1">
                <EditableDateCell value={r['תאריך אחרון']} onSave={v => saveDate(r._id, 'תאריך אחרון', v)} />
              </td>
              <td className="border border-[#999] px-3 py-1.5"><StatusBadge status={r._status} /></td>
            </tr>
          ))}
          {rows.length === 0 && !loading && (
            <tr><td colSpan={7} className="text-center py-4 text-gray-400">אין תוצאות</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
