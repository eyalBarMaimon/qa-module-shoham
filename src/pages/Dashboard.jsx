import { useEffect, useMemo } from 'react';
import DocHeader from '../components/DocHeader';
import StatusBadge from '../components/StatusBadge';
import { useCollection as useSheets } from '../hooks/useCollection';
import { calcStatus } from '../hooks/useStatus';
import { daysUntil } from '../utils/dateUtils';

function SummaryCard({ label, count, color }) {
  const bg = { red: 'bg-[#FECDD3]', amber: 'bg-[#FEF3C7]' }[color] || 'bg-gray-100';
  const text = { red: 'text-[#991B1B]', amber: 'text-[#92400E]' }[color] || 'text-gray-700';
  return (
    <div className={`rounded p-4 ${bg} ${text} text-center`}>
      <div className="text-3xl font-bold">{count}</div>
      <div className="text-sm mt-1">{label}</div>
    </div>
  );
}

export default function Dashboard() {
  const tools = useSheets('Tools');
  const suppliers = useSheets('Suppliers');

  useEffect(() => { tools.fetchSheet(); suppliers.fetchSheet(); }, []);

  const toolsExpired = useMemo(() =>
    tools.data.filter(r => calcStatus(r['מועד הבא'], 'tools') === 'red').length,
    [tools.data]);
  const toolsAmber = useMemo(() =>
    tools.data.filter(r => calcStatus(r['מועד הבא'], 'tools') === 'amber').length,
    [tools.data]);
  const suppExpired = useMemo(() =>
    suppliers.data.filter(r => calcStatus(r['תוקף עד'], 'suppliers') === 'red').length,
    [suppliers.data]);
  const suppAmber = useMemo(() =>
    suppliers.data.filter(r => calcStatus(r['תוקף עד'], 'suppliers') === 'amber').length,
    [suppliers.data]);

  const alerts = useMemo(() => {
    const rows = [];
    tools.data.forEach(r => {
      const s = calcStatus(r['מועד הבא'], 'tools');
      if (s === 'red' || s === 'amber')
        rows.push({ category: 'כלי מדידה', name: r['שם המכשיר'] || r['שם'], next: r['מועד הבא'], status: s });
    });
    suppliers.data.forEach(r => {
      const s = calcStatus(r['תוקף עד'], 'suppliers');
      if (s === 'red' || s === 'amber')
        rows.push({ category: 'ספק', name: r['שם ספק'], next: r['תוקף עד'], status: s });
    });
    return rows.sort((a, b) => (a.status === 'red' ? -1 : 1));
  }, [tools.data, suppliers.data]);

  const loading = tools.loading || suppliers.loading;

  return (
    <div>
      <DocHeader tab="dashboard" />
      {loading && <div className="text-center text-gray-400 py-4">טוען נתונים...</div>}
      {(tools.error || suppliers.error) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-4 text-sm text-yellow-800">
          לא ניתן להתחבר ל-Google Sheets. בדוק את הגדרות ה-API.
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <SummaryCard label="כלי מדידה — פג תוקף" count={toolsExpired} color="red" />
        <SummaryCard label="כלי מדידה — עד 60 יום" count={toolsAmber} color="amber" />
        <SummaryCard label="ספקים — פג תוקף" count={suppExpired} color="red" />
        <SummaryCard label="ספקים — עד 90 יום" count={suppAmber} color="amber" />
      </div>

      <div className="text-sm font-semibold mb-2">התראות פעילות</div>
      {alerts.length === 0 && !loading && (
        <div className="text-green-700 bg-green-50 border border-green-200 rounded p-3 text-sm">
          אין התראות פעילות — הכל תקין!
        </div>
      )}
      {alerts.length > 0 && (
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-[#D9D9D9] text-right">
              <th className="border border-[#999] px-3 py-2">קטגוריה</th>
              <th className="border border-[#999] px-3 py-2">שם</th>
              <th className="border border-[#999] px-3 py-2">מועד הבא</th>
              <th className="border border-[#999] px-3 py-2">סטטוס</th>
            </tr>
          </thead>
          <tbody>
            {alerts.map((a, i) => (
              <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-[#FAFAFA]'}>
                <td className="border border-[#999] px-3 py-1.5">{a.category}</td>
                <td className="border border-[#999] px-3 py-1.5">{a.name}</td>
                <td className="border border-[#999] px-3 py-1.5">{a.next}</td>
                <td className="border border-[#999] px-3 py-1.5"><StatusBadge status={a.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
