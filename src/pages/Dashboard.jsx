import { useEffect, useMemo } from 'react';
import DocHeader from '../components/DocHeader';
import StatusBadge from '../components/StatusBadge';
import { useCollection as useSheets } from '../hooks/useCollection';
import { calcStatus, calcFilterStatus } from '../hooks/useStatus';

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

export default function Dashboard({ onNavigate }) {
  const tools     = useSheets('Tools');
  const suppliers = useSheets('Suppliers');
  const machines  = useSheets('Machines');
  const filters   = useSheets('Filters');

  useEffect(() => {
    tools.fetchSheet();
    suppliers.fetchSheet();
    machines.fetchSheet();
    filters.fetchSheet();
  }, []);

  const toolsExpired  = useMemo(() => tools.data.filter(r => calcStatus(r['מועד הבא'], 'tools') === 'red').length, [tools.data]);
  const toolsAmber    = useMemo(() => tools.data.filter(r => calcStatus(r['מועד הבא'], 'tools') === 'amber').length, [tools.data]);
  const suppExpired   = useMemo(() => suppliers.data.filter(r => calcStatus(r['תוקף עד'], 'suppliers') === 'red').length, [suppliers.data]);
  const suppAmber     = useMemo(() => suppliers.data.filter(r => calcStatus(r['תוקף עד'], 'suppliers') === 'amber').length, [suppliers.data]);
  const machExpired   = useMemo(() => machines.data.filter(r => calcStatus(r['מועד הבא'], 'machines') === 'red').length, [machines.data]);
  const machAmber     = useMemo(() => machines.data.filter(r => calcStatus(r['מועד הבא'], 'machines') === 'amber').length, [machines.data]);
  const filtAmber     = useMemo(() => filters.data.filter(r => calcFilterStatus(r['תאריך אחרון'], r['תדירות']) === 'amber').length, [filters.data]);

  const alerts = useMemo(() => {
    const rows = [];
    tools.data.forEach(r => {
      const s = calcStatus(r['מועד הבא'], 'tools');
      if (s === 'red' || s === 'amber')
        rows.push({ category: 'כלי מדידה', name: r['שם המכשיר'] || r['שם'], next: r['מועד הבא'], status: s, tab: 'tools' });
    });
    suppliers.data.forEach(r => {
      const s = calcStatus(r['תוקף עד'], 'suppliers');
      if (s === 'red' || s === 'amber')
        rows.push({ category: 'ספק', name: r['שם ספק'], next: r['תוקף עד'], status: s, tab: 'suppliers' });
    });
    machines.data.forEach(r => {
      const s = calcStatus(r['מועד הבא'], 'machines');
      if (s === 'red' || s === 'amber')
        rows.push({ category: 'מערכת', name: r['שם'], next: r['מועד הבא'], status: s, tab: 'machines' });
<<<<<<< HEAD
    });
    filters.data.forEach(r => {
      const s = calcFilterStatus(r['תאריך אחרון'], r['תדירות']);
      if (s === 'amber')
        rows.push({ category: 'פילטר', name: `${r['מ. פילטר']} — ${r['מכונה']}`, next: r['תאריך אחרון'] || '—', status: s, tab: 'filters' });
=======
>>>>>>> 1625078d5497f20d70220ddefbcf9989074d1a99
    });
    return rows.sort((a, b) => {
      if (a.status === b.status) return 0;
      return a.status === 'red' ? -1 : 1;
    });
  }, [tools.data, suppliers.data, machines.data, filters.data]);

  const loading = tools.loading || suppliers.loading || machines.loading || filters.loading;

  return (
    <div>
      <DocHeader tab="dashboard" lastUpdate={null} />
      {loading && <div className="text-center text-gray-400 py-4">טוען נתונים...</div>}

      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3 mb-6">
        <SummaryCard label="כלי מדידה — פג תוקף" count={toolsExpired} color="red" />
        <SummaryCard label="כלי מדידה — עד 60 יום" count={toolsAmber} color="amber" />
        <SummaryCard label="מערכות — פג תוקף" count={machExpired} color="red" />
        <SummaryCard label="מערכות — עד 60 יום" count={machAmber} color="amber" />
        <SummaryCard label="ספקים — פג תוקף" count={suppExpired} color="red" />
        <SummaryCard label="ספקים — עד 90 יום" count={suppAmber} color="amber" />
        <SummaryCard label="פילטרים — דורש טיפול" count={filtAmber} color="amber" />
      </div>

      <div className="text-sm font-semibold mb-2">התראות פעילות</div>
      {alerts.length === 0 && !loading && (
        <div className="text-green-700 bg-green-50 border border-green-200 rounded p-3 text-sm">
          אין התראות פעילות — הכל תקין!
        </div>
      )}
      {alerts.length > 0 && (
        <div className="overflow-x-auto">
        <table className="w-full min-w-[480px] text-sm border-collapse">
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
                <td className="border border-[#999] px-3 py-1.5">
                  {onNavigate ? (
                    <button
                      onClick={() => onNavigate(a.tab, a.name)}
                      className="text-blue-700 hover:underline text-right w-full"
                    >
                      {a.name}
                    </button>
                  ) : a.name}
                </td>
                <td className="border border-[#999] px-3 py-1.5">{a.next}</td>
                <td className="border border-[#999] px-3 py-1.5"><StatusBadge status={a.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}
    </div>
  );
}
