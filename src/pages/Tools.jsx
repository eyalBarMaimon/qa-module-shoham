import { useEffect, useState, useMemo, useRef } from 'react';
import DocHeader from '../components/DocHeader';
import StatusBadge from '../components/StatusBadge';
import { useCollection as useSheets } from '../hooks/useCollection';
import { calcStatus } from '../hooks/useStatus';
import { exportTablePDF } from '../utils/exportPDF';

// ── Inspection dialog ────────────────────────────────────────────────────────
function InspectionDialog({ tool, onClose, historyCol, toolsCol, employees }) {
  const history = useMemo(() =>
    [...historyCol.data]
      .filter(r => r['מספר סידורי'] === tool['מספר סידורי'])
      .sort((a, b) => (b.recordedAt || '').localeCompare(a.recordedAt || '')),
    [historyCol.data, tool]
  );

  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({ תאריך: today, מועד_הבא: '', בוצע_על_ידי: '', הערה: '' });
  const [nextMode, setNextMode] = useState('date');
  const [saving, setSaving] = useState(false);
  const [showList, setShowList] = useState(false);
  const dropRef = useRef(null);

  useEffect(() => {
    function handleClick(e) { if (dropRef.current && !dropRef.current.contains(e.target)) setShowList(false); }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function toDisplay(isoDate) {
    if (!isoDate) return '';
    const [y, m, d] = isoDate.split('-');
    return `${d}/${m}/${y}`;
  }

  async function handleSave() {
    if (!form.תאריך) return;
    setSaving(true);
    const displayDate    = toDisplay(form.תאריך);
    const displayNextDate = nextMode === 'note' && form.הערה.trim()
      ? form.הערה.trim()
      : form.מועד_הבא ? toDisplay(form.מועד_הבא) : tool['מועד הבא'];

    await historyCol.appendRow({
      'מספר סידורי':  tool['מספר סידורי'],
      'שם המכשיר':    tool['שם המכשיר'],
      'תאריך בדיקה':  displayDate,
      'מועד הבא':     displayNextDate,
      'בוצע על ידי':  form.בוצע_על_ידי,
      recordedAt:     new Date().toISOString(),
    });

    // Update tool's current dates
    toolsCol.setData(prev => prev.map(r =>
      r._id === tool._id
        ? { ...r, 'תאריך בדיקה': displayDate, 'מועד הבא': displayNextDate }
        : r
    ));
    await toolsCol.updateRow(tool._id, { 'תאריך בדיקה': displayDate, 'מועד הבא': displayNextDate });

    await historyCol.fetchSheet();
    setSaving(false);
    setNextMode('date');
    setForm({ תאריך: today, מועד_הבא: '', בוצע_על_ידי: '', הערה: '' });
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col" dir="rtl">

        {/* Header */}
        <div className="flex justify-between items-center px-5 py-3 border-b border-gray-200">
          <div>
            <div className="font-bold text-base">{tool['שם המכשיר']}</div>
            <div className="text-xs text-gray-500">מ. סידורי: {tool['מספר סידורי']}</div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        {/* New inspection form */}
        <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
          <div className="font-semibold text-sm mb-3">עדכון בדיקה חדשה</div>
          <div className="flex flex-wrap gap-3">
            <div>
              <label className="text-xs text-gray-500 block mb-1">תאריך בדיקה</label>
              <input type="date" value={form.תאריך}
                onChange={e => setForm(f => ({ ...f, תאריך: e.target.value }))}
                className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-400" dir="ltr" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <label className="text-xs text-gray-500">מועד הבא (אופציונלי)</label>
                <div className="flex rounded overflow-hidden border border-gray-300 text-xs">
                  <button type="button"
                    onClick={() => setNextMode('date')}
                    className={`px-2 py-0.5 ${nextMode === 'date' ? 'bg-blue-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
                  >תאריך</button>
                  <button type="button"
                    onClick={() => setNextMode('note')}
                    className={`px-2 py-0.5 ${nextMode === 'note' ? 'bg-blue-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
                  >הערה</button>
                </div>
              </div>
              {nextMode === 'date' ? (
                <input type="date" value={form.מועד_הבא}
                  onChange={e => setForm(f => ({ ...f, מועד_הבא: e.target.value }))}
                  className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-400" dir="ltr" />
              ) : (
                <input type="text" value={form.הערה}
                  onChange={e => setForm(f => ({ ...f, הערה: e.target.value }))}
                  placeholder='למשל: אצל ספק, בבדיקה...'
                  className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-400 w-44" />
              )}
            </div>
            <div ref={dropRef} className="relative">
              <label className="text-xs text-gray-500 block mb-1">בוצע על ידי</label>
              <div className="flex gap-1">
                <input
                  value={form.בוצע_על_ידי}
                  onChange={e => setForm(f => ({ ...f, בוצע_על_ידי: e.target.value }))}
                  placeholder="שם הבודק"
                  className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-400 w-36"
                />
                {employees.length > 0 && (
                  <button type="button" onClick={() => setShowList(s => !s)}
                    className="border border-gray-300 rounded px-2 text-gray-500 hover:text-blue-600 text-xs">▼</button>
                )}
              </div>
              {showList && (
                <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded shadow-lg z-10 min-w-[150px] py-1">
                  {employees.map(e => (
                    <button key={e} onClick={() => { setForm(f => ({ ...f, בוצע_על_ידי: e })); setShowList(false); }}
                      className="block w-full text-right px-3 py-1.5 text-sm hover:bg-blue-50">{e}</button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={saving || !form.תאריך}
            className="mt-3 bg-blue-600 text-white px-4 py-1.5 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'שומר...' : 'שמור בדיקה'}
          </button>
        </div>

        {/* History */}
        <div className="flex-1 overflow-y-auto px-5 py-3">
          <div className="font-semibold text-sm mb-2">היסטוריית בדיקות</div>
          {historyCol.loading && <div className="text-gray-400 text-sm">טוען...</div>}
          {!historyCol.loading && history.length === 0 && (
            <div className="text-gray-400 text-sm">אין בדיקות קודמות</div>
          )}
          {history.length > 0 && (
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-100 text-right">
                  <th className="border border-gray-200 px-3 py-1.5 font-semibold">תאריך בדיקה</th>
                  <th className="border border-gray-200 px-3 py-1.5 font-semibold">מועד הבא</th>
                  <th className="border border-gray-200 px-3 py-1.5 font-semibold">בוצע על ידי</th>
                </tr>
              </thead>
              <tbody>
                {history.map((r, i) => (
                  <tr key={r._id || i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="border border-gray-200 px-3 py-1.5">{r['תאריך בדיקה']}</td>
                    <td className="border border-gray-200 px-3 py-1.5">{r['מועד הבא']}</td>
                    <td className="border border-gray-200 px-3 py-1.5">{r['בוצע על ידי']}</td>
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

// ── Main page ────────────────────────────────────────────────────────────────
export default function Tools() {
  const toolsCol   = useSheets('Tools');
  const historyCol = useSheets('ToolsHistory');
  const empCol     = useSheets('Employees');

  const [search, setSearch]             = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [activeTool, setActiveTool]     = useState(null);
  const [togglingId, setTogglingId]     = useState(null);

  useEffect(() => {
    toolsCol.fetchSheet();
    historyCol.fetchSheet();
    empCol.fetchSheet();
  }, []);

  const employees = useMemo(() =>
    empCol.data.map(r => r['שם'] || Object.values(r).find(v => v && v !== r._id)).filter(Boolean),
    [empCol.data]
  );

  async function handleDeactivate(row) {
    setTogglingId(row._id);
    toolsCol.setData(prev => prev.map(r =>
      r._id === row._id ? { ...r, 'מועד הבא': 'לא בשימוש' } : r
    ));
    await toolsCol.updateRow(row._id, { 'מועד הבא': 'לא בשימוש' });
    setTogglingId(null);
  }

  const rows = useMemo(() => {
    return toolsCol.data
      .map(r => ({ ...r, _status: calcStatus(r['מועד הבא'], 'tools') }))
      .filter(r => {
        const q = search.toLowerCase();
        const matchSearch = !q || (r['שם המכשיר'] || '').toLowerCase().includes(q) || (r['מספר סידורי'] || '').toLowerCase().includes(q);
        const matchStatus = filterStatus === 'all' || r._status === filterStatus;
        return matchSearch && matchStatus;
      });
  }, [toolsCol.data, search, filterStatus]);

  const cols = ['#', 'שם המכשיר', 'מספר סידורי', 'תאריך בדיקה', 'מועד הבא', 'מיקום', 'סטטוס'];

  return (
    <div>
      <DocHeader tab="tools" />
      <div className="flex flex-wrap gap-2 mb-3 items-center">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="חיפוש שם / מ. סידורי"
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
          <option value="gray">לא פעיל</option>
        </select>
        <button
          onClick={() => exportTablePDF('tools', cols, rows.map(r => cols.map(c => c === 'סטטוס' ? r._status : (r[c] ?? ''))))}
          className="mr-auto bg-blue-600 text-white px-4 py-1.5 rounded text-sm hover:bg-blue-700"
        >
          ייצוא PDF
        </button>
      </div>

      {toolsCol.loading && <div className="text-center text-gray-400 py-4">טוען...</div>}
      {toolsCol.error && <div className="text-red-500 text-sm mb-3">{toolsCol.error}</div>}

      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-[#D9D9D9] text-right">
            {cols.map(c => <th key={c} className="border border-[#999] px-3 py-2 font-bold">{c}</th>)}
            <th className="border border-[#999] px-2 py-2 font-bold">בדיקה</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r._id || i} className={i % 2 === 0 ? 'bg-white' : 'bg-[#FAFAFA]'}>
              <td className="border border-[#999] px-3 py-1.5">{r['#']}</td>
              <td className="border border-[#999] px-3 py-1.5">{r['שם המכשיר']}</td>
              <td className="border border-[#999] px-3 py-1.5">{r['מספר סידורי']}</td>
              <td className="border border-[#999] px-3 py-1.5">{r['תאריך בדיקה']}</td>
              <td className="border border-[#999] px-3 py-1.5">{r['מועד הבא']}</td>
              <td className="border border-[#999] px-3 py-1.5">{r['מיקום']}</td>
              <td className="border border-[#999] px-3 py-1.5"><StatusBadge status={r._status} /></td>
              <td className="border border-[#999] px-2 py-1.5 text-center">
                <div className="flex flex-col items-center gap-1">
                  <button
                    onClick={() => setActiveTool(r)}
                    className="text-blue-600 text-xs hover:underline whitespace-nowrap"
                  >
                    עדכן / היסטוריה
                  </button>
                  {r._status === 'gray' ? (
                    <button
                      onClick={() => setActiveTool(r)}
                      className="text-green-700 text-xs hover:underline whitespace-nowrap"
                    >
                      הפעל
                    </button>
                  ) : (
                    <button
                      onClick={() => handleDeactivate(r)}
                      disabled={togglingId === r._id}
                      className="text-gray-400 text-xs hover:text-red-500 hover:underline whitespace-nowrap disabled:opacity-50"
                    >
                      {togglingId === r._id ? '...' : 'השבת'}
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
          {rows.length === 0 && !toolsCol.loading && (
            <tr><td colSpan={8} className="text-center py-4 text-gray-400">אין תוצאות</td></tr>
          )}
        </tbody>
      </table>

      {activeTool && (
        <InspectionDialog
          tool={activeTool}
          onClose={() => setActiveTool(null)}
          historyCol={historyCol}
          toolsCol={toolsCol}
          employees={employees}
        />
      )}
    </div>
  );
}
