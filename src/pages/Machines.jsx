import { useEffect, useState, useMemo } from 'react';
import DocHeader from '../components/DocHeader';
import StatusBadge from '../components/StatusBadge';
import SortableHeader from '../components/SortableHeader';
import { useCollection as useSheets } from '../hooks/useCollection';
import { calcStatus } from '../hooks/useStatus';
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

// ── Machine calibration dialog ─────────────────────────────────────────────────
function MachineDialog({ machine, onClose, historyCol, machinesCol }) {
  const history = useMemo(() => {
    const records = [...historyCol.data]
      .filter(r => r.machine_id === machine._id)
      .sort((a, b) => (b.recordedAt || '').localeCompare(a.recordedAt || ''));

    if (records.length === 0 && (machine['תאריך כיול'] || machine['מועד הבא'])) {
      return [{
        _baseline: true,
        'תאריך כיול': machine['תאריך כיול'] || '—',
        'מועד הבא':   machine['מועד הבא']   || '—',
        'בוצע על ידי': '—',
        recordedAt: '',
      }];
    }
    return records;
  }, [historyCol.data, machine]);

  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({
    תאריך_כיול: toISO(machine['תאריך כיול']) || today,
    מועד_הבא:   toISO(machine['מועד הבא'])   || '',
    בוצע_על_ידי: '',
  });
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);

    const realRecords = historyCol.data.filter(r => r.machine_id === machine._id);
    if (realRecords.length === 0 && (machine['תאריך כיול'] || machine['מועד הבא'])) {
      await historyCol.appendRow({
        machine_id:   machine._id,
        'מ. מכונה':  machine['מ. מכונה'],
        'תאריך כיול': machine['תאריך כיול'] || '—',
        'מועד הבא':   machine['מועד הבא']   || '—',
        'בוצע על ידי': '—',
        recordedAt:   '2000-01-01T00:00:00.000Z',
      });
    }

    const displayKiyul = toDisplay(form.תאריך_כיול);
    const displayNext  = toDisplay(form.מועד_הבא);

    await historyCol.appendRow({
      machine_id:   machine._id,
      'מ. מכונה':  machine['מ. מכונה'],
      'תאריך כיול': displayKiyul,
      'מועד הבא':   displayNext  || '—',
      'בוצע על ידי': form.בוצע_על_ידי || '—',
      recordedAt:   new Date().toISOString(),
    });

    machinesCol.setData(prev => prev.map(r =>
      r._id === machine._id
        ? { ...r, 'תאריך כיול': displayKiyul, 'מועד הבא': displayNext }
        : r
    ));
    await machinesCol.updateRow(machine._id, { 'תאריך כיול': displayKiyul, 'מועד הבא': displayNext });
    await historyCol.fetchSheet();
    setSaving(false);
    setForm({ תאריך_כיול: form.תאריך_כיול, מועד_הבא: form.מועד_הבא, בוצע_על_ידי: '' });
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col" dir="rtl">

        <div className="flex justify-between items-center px-5 py-3 border-b border-gray-200">
          <div>
            <div className="font-bold text-base">{machine['שם']}</div>
            <div className="text-xs text-gray-500">
              מ. מכונה: {machine['מ. מכונה']} · {machine['יצרן']} · {machine['מיקום']}
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
          <div className="font-semibold text-sm mb-3">רישום כיול</div>
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="text-xs text-gray-500 block mb-1">תאריך כיול</label>
              <input type="date" value={form.תאריך_כיול}
                onChange={e => setForm(f => ({ ...f, תאריך_כיול: e.target.value }))}
                className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-400" dir="ltr" />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">מועד הבא</label>
              <input type="date" value={form.מועד_הבא}
                onChange={e => setForm(f => ({ ...f, מועד_הבא: e.target.value }))}
                className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-400" dir="ltr" />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">בוצע על ידי</label>
              <input value={form.בוצע_על_ידי}
                onChange={e => setForm(f => ({ ...f, בוצע_על_ידי: e.target.value }))}
                placeholder="שם המבצע"
                className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-400 w-40" />
            </div>
          </div>
          <button onClick={handleSave} disabled={saving || !form.תאריך_כיול}
            className="mt-3 bg-blue-600 text-white px-4 py-1.5 rounded text-sm hover:bg-blue-700 disabled:opacity-50">
            {saving ? 'שומר...' : 'שמור כיול'}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-3">
          <div className="font-semibold text-sm mb-2">היסטוריית כיולים</div>
          {historyCol.loading && <div className="text-gray-400 text-sm">טוען...</div>}
          {!historyCol.loading && history.length === 0 && (
            <div className="text-gray-400 text-sm">אין כיולים קודמים</div>
          )}
          {history.length > 0 && (
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-100 text-right">
                  <th className="border border-gray-200 px-3 py-1.5 font-semibold">תאריך כיול</th>
                  <th className="border border-gray-200 px-3 py-1.5 font-semibold">מועד הבא</th>
                  <th className="border border-gray-200 px-3 py-1.5 font-semibold">בוצע על ידי</th>
                  <th className="border border-gray-200 px-3 py-1.5 font-semibold">נרשם בתאריך</th>
                </tr>
              </thead>
              <tbody>
                {history.map((r, i) => (
                  <tr key={r._id || i} className={r._baseline ? 'bg-yellow-50' : i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="border border-gray-200 px-3 py-1.5">
                      {r['תאריך כיול']}
                      {r._baseline && <span className="mr-2 text-xs text-yellow-700">(נתון קיים)</span>}
                    </td>
                    <td className="border border-gray-200 px-3 py-1.5">{r['מועד הבא']}</td>
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
export default function Machines() {
  const machinesCol = useSheets('Machines');
  const historyCol  = useSheets('MachinesHistory');
  const [filterStatus, setFilterStatus] = useState('all');
  const [activeMachine, setActiveMachine] = useState(null);

  useEffect(() => {
    machinesCol.fetchSheet();
    historyCol.fetchSheet();
  }, []);

  const filtered = useMemo(() =>
    machinesCol.data
      .map(r => ({ ...r, _status: calcStatus(r['מועד הבא'], 'machines') }))
      .filter(r => filterStatus === 'all' || r._status === filterStatus),
    [machinesCol.data, filterStatus]);

  const { sorted: rows, sort, toggleSort } = useSortable(filtered);

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
      {machinesCol.loading && <div className="text-center text-gray-400 py-4">טוען...</div>}
      {machinesCol.error && <div className="text-red-500 text-sm mb-3">{machinesCol.error}</div>}
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-[#D9D9D9] text-right">
            <SortableHeader col="מ. מכונה"    label="מ. מכונה"    sort={sort} onSort={toggleSort} />
            <SortableHeader col="שם"           label="שם"           sort={sort} onSort={toggleSort} />
            <SortableHeader col="יצרן"          label="יצרן"          sort={sort} onSort={toggleSort} />
            <SortableHeader col="תאריך כיול"   label="תאריך כיול"   sort={sort} onSort={toggleSort} />
            <SortableHeader col="מועד הבא"     label="מועד הבא"     sort={sort} onSort={toggleSort} />
            <SortableHeader col="מיקום"         label="מיקום"         sort={sort} onSort={toggleSort} />
            <SortableHeader col="_status"       label="סטטוס"         sort={sort} onSort={toggleSort} />
            <th className="border border-[#999] px-2 py-2 font-bold">פעולות</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r._id || i} className={i % 2 === 0 ? 'bg-white' : 'bg-[#FAFAFA]'}>
              <td className="border border-[#999] px-3 py-1.5">{r['מ. מכונה']}</td>
              <td className="border border-[#999] px-3 py-1.5">{r['שם']}</td>
              <td className="border border-[#999] px-3 py-1.5">{r['יצרן']}</td>
              <td className="border border-[#999] px-3 py-1.5">{r['תאריך כיול']}</td>
              <td className="border border-[#999] px-3 py-1.5">{r['מועד הבא']}</td>
              <td className="border border-[#999] px-3 py-1.5">{r['מיקום']}</td>
              <td className="border border-[#999] px-3 py-1.5"><StatusBadge status={r._status} /></td>
              <td className="border border-[#999] px-2 py-1.5 text-center">
                <button
                  onClick={() => setActiveMachine(r)}
                  className="text-blue-600 text-xs hover:underline whitespace-nowrap"
                >
                  עדכן / היסטוריה
                </button>
              </td>
            </tr>
          ))}
          {rows.length === 0 && !machinesCol.loading && (
            <tr><td colSpan={8} className="text-center py-4 text-gray-400">אין תוצאות</td></tr>
          )}
        </tbody>
      </table>

      {activeMachine && (
        <MachineDialog
          machine={activeMachine}
          onClose={() => setActiveMachine(null)}
          historyCol={historyCol}
          machinesCol={machinesCol}
        />
      )}
    </div>
  );
}
