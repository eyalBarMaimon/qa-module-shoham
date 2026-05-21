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

// ── Add supplier dialog ───────────────────────────────────────────────────────
function AddSupplierDialog({ onClose, onSave }) {
  const [form, setForm] = useState({ 'שם ספק': '', 'סוג הסמכה': '', 'תוקף עד': '', 'הערות': '' });
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!form['שם ספק'].trim()) return;
    setSaving(true);
    await onSave({ ...form, 'תוקף עד': toDisplay(form['תוקף עד']) });
    setSaving(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded shadow-xl w-full max-w-md" dir="rtl">
        <div className="flex justify-between items-center px-5 py-3 border-b border-gray-200">
          <div className="font-bold text-base">הוספת ספק חדש</div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>
        <div className="px-5 py-4 grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="text-xs text-gray-500 block mb-1">שם ספק *</label>
            <input value={form['שם ספק']} onChange={e => setForm(f => ({ ...f, 'שם ספק': e.target.value }))}
              className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-400 w-full" />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">סוג הסמכה</label>
            <input value={form['סוג הסמכה']} onChange={e => setForm(f => ({ ...f, 'סוג הסמכה': e.target.value }))}
              className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-400 w-full" />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">תוקף עד</label>
            <input type="date" value={form['תוקף עד']} onChange={e => setForm(f => ({ ...f, 'תוקף עד': e.target.value }))}
              className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-400 w-full" dir="ltr" />
          </div>
          <div className="col-span-2">
            <label className="text-xs text-gray-500 block mb-1">הערות</label>
            <input value={form['הערות']} onChange={e => setForm(f => ({ ...f, 'הערות': e.target.value }))}
              className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-400 w-full" />
          </div>
        </div>
        <div className="px-5 py-3 border-t border-gray-100 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded">ביטול</button>
          <button onClick={handleSave} disabled={saving || !form['שם ספק'].trim()}
            className="bg-green-600 text-white px-4 py-1.5 rounded text-sm hover:bg-green-700 disabled:opacity-50">
            {saving ? 'שומר...' : 'הוסף ספק'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Supplier update + history dialog ─────────────────────────────────────────
function SupplierDialog({ supplier, onClose, historyCol, suppliersCol }) {
  const history = useMemo(() => {
    const records = [...historyCol.data]
      .filter(r => r.supplier_id === supplier._id)
      .sort((a, b) => (b.recordedAt || '').localeCompare(a.recordedAt || ''));

    if (records.length === 0 && (supplier['תוקף עד'] || supplier['הערות'])) {
      return [{
        _baseline: true,
        'תוקף עד': supplier['תוקף עד'] || '—',
        'הערות':   supplier['הערות']   || '—',
        recordedAt: '',
      }];
    }
    return records;
  }, [historyCol.data, supplier]);

  const [form, setForm] = useState({
    תוקף_עד: toISO(supplier['תוקף עד']),
    הערות:   supplier['הערות'] || '',
  });
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);

    const realRecords = historyCol.data.filter(r => r.supplier_id === supplier._id);
    if (realRecords.length === 0 && (supplier['תוקף עד'] || supplier['הערות'])) {
      await historyCol.appendRow({
        supplier_id: supplier._id,
        'שם ספק':   supplier['שם ספק'],
        'תוקף עד':  supplier['תוקף עד'] || '—',
        'הערות':    supplier['הערות']   || '—',
        recordedAt: '2000-01-01T00:00:00.000Z',
      });
    }

    const displayDate = toDisplay(form.תוקף_עד);
    await historyCol.appendRow({
      supplier_id: supplier._id,
      'שם ספק':   supplier['שם ספק'],
      'תוקף עד':  displayDate || '—',
      'הערות':    form.הערות || '—',
      recordedAt: new Date().toISOString(),
    });

    suppliersCol.setData(prev => prev.map(r =>
      r._id === supplier._id
        ? { ...r, 'תוקף עד': displayDate, 'הערות': form.הערות }
        : r
    ));
    await suppliersCol.updateRow(supplier._id, { 'תוקף עד': displayDate, 'הערות': form.הערות });
    await historyCol.fetchSheet();
    setSaving(false);
    setForm({ תוקף_עד: form.תוקף_עד, הערות: form.הערות });
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col" dir="rtl">

        <div className="flex justify-between items-center px-5 py-3 border-b border-gray-200">
          <div>
            <div className="font-bold text-base">{supplier['שם ספק']}</div>
            <div className="text-xs text-gray-500">סוג הסמכה: {supplier['סוג הסמכה'] || supplier['תעודת ISO'] || '—'}</div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
          <div className="font-semibold text-sm mb-3">עדכון פרטים</div>
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="text-xs text-gray-500 block mb-1">תוקף עד</label>
              <input type="date" value={form.תוקף_עד}
                onChange={e => setForm(f => ({ ...f, תוקף_עד: e.target.value }))}
                className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-400" dir="ltr" />
            </div>
            <div className="flex-1 min-w-[180px]">
              <label className="text-xs text-gray-500 block mb-1">הערות</label>
              <input value={form.הערות}
                onChange={e => setForm(f => ({ ...f, הערות: e.target.value }))}
                placeholder="הערות לגבי ספק..."
                className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-400 w-full" />
            </div>
          </div>
          <button onClick={handleSave} disabled={saving}
            className="mt-3 bg-blue-600 text-white px-4 py-1.5 rounded text-sm hover:bg-blue-700 disabled:opacity-50">
            {saving ? 'שומר...' : 'שמור עדכון'}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-3">
          <div className="font-semibold text-sm mb-2">היסטוריה</div>
          {historyCol.loading && <div className="text-gray-400 text-sm">טוען...</div>}
          {!historyCol.loading && history.length === 0 && (
            <div className="text-gray-400 text-sm">אין עדכונים קודמים</div>
          )}
          {history.length > 0 && (
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-100 text-right">
                  <th className="border border-gray-200 px-3 py-1.5 font-semibold">תוקף עד</th>
                  <th className="border border-gray-200 px-3 py-1.5 font-semibold">הערות</th>
                  <th className="border border-gray-200 px-3 py-1.5 font-semibold">תאריך עדכון</th>
                </tr>
              </thead>
              <tbody>
                {history.map((r, i) => (
                  <tr key={r._id || i} className={r._baseline ? 'bg-yellow-50' : i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="border border-gray-200 px-3 py-1.5">
                      {r['תוקף עד']}
                      {r._baseline && <span className="mr-2 text-xs text-yellow-700">(נתון קיים)</span>}
                    </td>
                    <td className="border border-gray-200 px-3 py-1.5">{r['הערות']}</td>
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
export default function Suppliers() {
  const suppliersCol = useSheets('Suppliers');
  const historyCol   = useSheets('SuppliersHistory');
  const [search, setSearch]             = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [activeSup, setActiveSup]       = useState(null);
  const [showAddDialog, setShowAddDialog] = useState(false);

  useEffect(() => {
    suppliersCol.fetchSheet();
    historyCol.fetchSheet();
  }, []);

  async function handleAddSupplier(data) {
    await suppliersCol.appendRow(data);
    await suppliersCol.fetchSheet();
  }

  const filtered = useMemo(() =>
    suppliersCol.data
      .map(r => ({
        ...r,
        'סוג הסמכה': r['סוג הסמכה'] || r['תעודת ISO'] || '',
        _status: calcStatus(r['תוקף עד'], 'suppliers'),
      }))
      .filter(r => {
        const q = search.toLowerCase();
        const matchSearch = !q || (r['שם ספק'] || '').toLowerCase().includes(q);
        const matchStatus = filterStatus === 'all' || r._status === filterStatus;
        return matchSearch && matchStatus;
      }),
    [suppliersCol.data, search, filterStatus]);

  const { sorted: rows, sort, toggleSort } = useSortable(filtered);

  const cols = ['#', 'שם ספק', 'סוג הסמכה', 'תוקף עד', 'הערות', 'סטטוס'];

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
          <option value="gray">לא פעיל</option>
        </select>
        <button
          onClick={() => setShowAddDialog(true)}
          className="bg-green-600 text-white px-4 py-1.5 rounded text-sm hover:bg-green-700"
        >
          + הוסף ספק
        </button>
        <button
          onClick={() => exportTablePDF('suppliers', cols, rows.map(r => cols.map(c => c === 'סטטוס' ? r._status : (r[c] ?? ''))))}
          className="mr-auto bg-blue-600 text-white px-4 py-1.5 rounded text-sm hover:bg-blue-700"
        >
          ייצוא PDF
        </button>
      </div>
      {suppliersCol.loading && <div className="text-center text-gray-400 py-4">טוען...</div>}
      {suppliersCol.error && <div className="text-red-500 text-sm mb-3">{suppliersCol.error}</div>}
      <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-[#D9D9D9] text-right">
            <SortableHeader col="#"          label="#"          sort={sort} onSort={toggleSort} />
            <SortableHeader col="שם ספק"    label="שם ספק"    sort={sort} onSort={toggleSort} />
            <SortableHeader col="סוג הסמכה"  label="סוג הסמכה"  sort={sort} onSort={toggleSort} />
            <SortableHeader col="תוקף עד"   label="תוקף עד"   sort={sort} onSort={toggleSort} />
            <SortableHeader col="הערות"      label="הערות"      sort={sort} onSort={toggleSort} />
            <SortableHeader col="_status"    label="סטטוס"      sort={sort} onSort={toggleSort} />
            <th className="border border-[#999] px-2 py-2 font-bold">פעולות</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r._id || i} className={i % 2 === 0 ? 'bg-white' : 'bg-[#FAFAFA]'}>
              <td className="border border-[#999] px-3 py-1.5">{r['#']}</td>
              <td className="border border-[#999] px-3 py-1.5">{r['שם ספק']}</td>
              <td className="border border-[#999] px-3 py-1.5">{r['סוג הסמכה']}</td>
              <td className="border border-[#999] px-3 py-1.5">{r['תוקף עד']}</td>
              <td className="border border-[#999] px-3 py-1.5">{r['הערות']}</td>
              <td className="border border-[#999] px-3 py-1.5"><StatusBadge status={r._status} /></td>
              <td className="border border-[#999] px-2 py-1.5 text-center">
                <button
                  onClick={() => setActiveSup(r)}
                  className="text-blue-600 text-xs hover:underline whitespace-nowrap"
                >
                  עדכן / היסטוריה
                </button>
              </td>
            </tr>
          ))}
          {rows.length === 0 && !suppliersCol.loading && (
            <tr><td colSpan={7} className="text-center py-4 text-gray-400">אין תוצאות</td></tr>
          )}
        </tbody>
      </table>
      </div>

      {activeSup && (
        <SupplierDialog
          supplier={activeSup}
          onClose={() => setActiveSup(null)}
          historyCol={historyCol}
          suppliersCol={suppliersCol}
        />
      )}

      {showAddDialog && (
        <AddSupplierDialog
          onClose={() => setShowAddDialog(false)}
          onSave={handleAddSupplier}
        />
      )}
    </div>
  );
}
