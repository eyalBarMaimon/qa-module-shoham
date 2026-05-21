import { useEffect, useState, useMemo } from 'react';
import DocHeader from '../components/DocHeader';
import StatusBadge from '../components/StatusBadge';
import { useCollection as useSheets } from '../hooks/useCollection';
import { calcStatus } from '../hooks/useStatus';
import { exportTablePDF } from '../utils/exportPDF';

export default function Suppliers() {
  const { data, loading, error, fetchSheet } = useSheets('Suppliers');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => { fetchSheet(); }, []);

  const rows = useMemo(() =>
    data
      .map(r => ({ ...r, _status: calcStatus(r['תוקף עד'], 'suppliers') }))
      .filter(r => {
        const q = search.toLowerCase();
        const matchSearch = !q || (r['שם ספק'] || '').toLowerCase().includes(q);
        const matchStatus = filterStatus === 'all' || r._status === filterStatus;
        return matchSearch && matchStatus;
      }),
    [data, search, filterStatus]);

  const cols = ['#', 'שם ספק', 'תעודת ISO', 'תוקף עד', 'הערות', 'סטטוס'];

  return (
    <div>
      <DocHeader tab="suppliers" />
      <div className="flex flex-wrap gap-2 mb-3 items-center">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="חיפוש שם ספק"
          className="border border-gray-300 rounded px-3 py-1.5 text-sm w-56 focus:outline-none focus:border-blue-400"
        />
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none"
        >
          <option value="all">כל הסטטוסים</option>
          <option value="red">פג תוקף</option>
          <option value="amber">בקרוב</option>
          <option value="green">תקין</option>
          <option value="gray">ללא תעודה</option>
        </select>
        <button
          onClick={() => exportTablePDF('suppliers', cols, rows.map(r => cols.map(c => c === 'סטטוס' ? r._status : (r[c] ?? ''))))}
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
            <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-[#FAFAFA]'}>
              <td className="border border-[#999] px-3 py-1.5">{r['#']}</td>
              <td className="border border-[#999] px-3 py-1.5">{r['שם ספק']}</td>
              <td className="border border-[#999] px-3 py-1.5">{r['תעודת ISO']}</td>
              <td className="border border-[#999] px-3 py-1.5">{r['תוקף עד']}</td>
              <td className="border border-[#999] px-3 py-1.5">{r['הערות']}</td>
              <td className="border border-[#999] px-3 py-1.5"><StatusBadge status={r._status} /></td>
            </tr>
          ))}
          {rows.length === 0 && !loading && (
            <tr><td colSpan={6} className="text-center py-4 text-gray-400">אין תוצאות</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
