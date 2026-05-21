import { useEffect, useState, useMemo } from 'react';
import DocHeader from '../components/DocHeader';
import StatusBadge from '../components/StatusBadge';
import EditableDateCell from '../components/EditableDateCell';
import { useCollection as useSheets } from '../hooks/useCollection';
import { calcStatus } from '../hooks/useStatus';
import { exportTablePDF } from '../utils/exportPDF';

export default function Machines() {
  const { data, loading, error, fetchSheet, updateRow, setData } = useSheets('Machines');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => { fetchSheet(); }, []);

  const rows = useMemo(() =>
    data
      .map(r => ({ ...r, _status: calcStatus(r['מועד הבא'], 'machines') }))
      .filter(r => filterStatus === 'all' || r._status === filterStatus),
    [data, filterStatus]);

  async function saveDate(docId, field, newVal) {
    setData(prev => prev.map(r => r._id === docId ? { ...r, [field]: newVal } : r));
    await updateRow(docId, { [field]: newVal });
  }

  const cols = ['מ. מכונה', 'שם', 'יצרן', 'תאריך כיול', 'מועד הבא', 'מיקום', 'סטטוס'];

  return (
    <div>
      <DocHeader tab="machines" />
      <div className="flex gap-2 mb-3 items-center">
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none"
        >
          <option value="all">כל הסטטוסים</option>
          <option value="red">פג תוקף</option>
          <option value="amber">בקרוב</option>
          <option value="green">תקין</option>
          <option value="gray">לא פעיל</option>
        </select>
        <button
          onClick={() => exportTablePDF('machines', cols, rows.map(r => cols.map(c => c === 'סטטוס' ? r._status : (r[c] ?? ''))))}
          className="mr-auto bg-blue-600 text-white px-4 py-1.5 rounded text-sm hover:bg-blue-700"
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
              <td className="border border-[#999] px-3 py-1.5">{r['מ. מכונה']}</td>
              <td className="border border-[#999] px-3 py-1.5">{r['שם']}</td>
              <td className="border border-[#999] px-3 py-1.5">{r['יצרן']}</td>
              <td className="border border-[#999] px-2 py-1">
                <EditableDateCell value={r['תאריך כיול']} onSave={v => saveDate(r._id, 'תאריך כיול', v)} />
              </td>
              <td className="border border-[#999] px-2 py-1">
                <EditableDateCell value={r['מועד הבא']} onSave={v => saveDate(r._id, 'מועד הבא', v)} />
              </td>
              <td className="border border-[#999] px-3 py-1.5">{r['מיקום']}</td>
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
