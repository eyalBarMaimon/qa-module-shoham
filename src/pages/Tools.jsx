import { useEffect, useState, useMemo, useRef } from 'react';
import DocHeader from '../components/DocHeader';
import StatusBadge from '../components/StatusBadge';
import SortableHeader from '../components/SortableHeader';
import { useCollection as useSheets } from '../hooks/useCollection';
import { calcStatus } from '../hooks/useStatus';
import { useSortable } from '../hooks/useSortable';
import { exportTablePDF } from '../utils/exportPDF';
import { buildFileName, uploadScanedDoc } from '../utils/fileUpload';
import FileDropZone from '../components/FileDropZone';

// ── Edit tool dialog ──────────────────────────────────────────────────────────
function EditToolDialog({ tool, onClose, onSave }) {
  const [form, setForm] = useState({
    '#':           tool['#']           || '',
    'שם המכשיר':  tool['שם המכשיר']  || '',
    'מספר סידורי': tool['מספר סידורי'] || '',
    'תחום מדידה':  tool['תחום מדידה']  || '',
    'מיקום':       tool['מיקום']       || '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  async function handleSave() {
    if (!form['שם המכשיר'].trim()) return;
    setSaving(true);
    await onSave(tool._id, form);
    setSaving(false);
    onClose();
  }

  const field = (label, key, dir = 'rtl') => (
    <div>
      <label className="text-xs text-gray-500 block mb-1">{label}</label>
      <input type="text" value={form[key]} dir={dir}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
        className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-400 w-full" />
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded shadow-xl w-full max-w-lg" dir="rtl" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center px-5 py-3 border-b border-gray-200">
          <div className="font-bold text-base">עריכת פרטי מכשיר</div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>
        <div className="px-5 py-4 grid grid-cols-2 gap-3">
          <div className="col-span-2">{field('שם המכשיר *', 'שם המכשיר')}</div>
          {field('מספר סידורי', 'מספר סידורי')}
          {field('תחום מדידה', 'תחום מדידה')}
          {field('#', '#', 'ltr')}
          <div>{field('מיקום', 'מיקום')}</div>
        </div>
        <div className="px-5 py-3 border-t border-gray-100 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded">ביטול</button>
          <button onClick={handleSave} disabled={saving || !form['שם המכשיר'].trim()}
            className="bg-blue-600 text-white px-4 py-1.5 rounded text-sm hover:bg-blue-700 disabled:opacity-50">
            {saving ? 'שומר...' : 'שמור שינויים'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Add tool dialog ───────────────────────────────────────────────────────────
function AddToolDialog({ onClose, onSave }) {
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({
    'שם המכשיר': '', 'מספר סידורי': '', 'תחום מדידה': '',
    'תאריך בדיקה': today, 'מועד הבא': '', 'מיקום': '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  function toDisplay(iso) {
    if (!iso) return '';
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
  }

  async function handleSave() {
    if (!form['שם המכשיר'].trim()) return;
    setSaving(true);
    await onSave({
      ...form,
      'תאריך בדיקה': toDisplay(form['תאריך בדיקה']),
      'מועד הבא':    toDisplay(form['מועד הבא']),
    });
    setSaving(false);
    onClose();
  }

  const field = (label, key, type = 'text', dir = 'rtl') => (
    <div>
      <label className="text-xs text-gray-500 block mb-1">{label}</label>
      <input
        type={type} value={form[key]} dir={dir}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
        className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-400 w-full"
      />
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded shadow-xl w-full max-w-lg" dir="rtl" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center px-5 py-3 border-b border-gray-200">
          <div className="font-bold text-base">הוספת מכשיר חדש</div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>
        <div className="px-5 py-4 grid grid-cols-2 gap-3">
          <div className="col-span-2">{field('שם המכשיר *', 'שם המכשיר')}</div>
          {field('מספר סידורי', 'מספר סידורי')}
          {field('תחום מדידה', 'תחום מדידה')}
          {field('תאריך בדיקה', 'תאריך בדיקה', 'date', 'ltr')}
          {field('מועד הבא', 'מועד הבא', 'date', 'ltr')}
          <div className="col-span-2">{field('מיקום', 'מיקום')}</div>
        </div>
        <div className="px-5 py-3 border-t border-gray-100 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded">ביטול</button>
          <button
            onClick={handleSave}
            disabled={saving || !form['שם המכשיר'].trim()}
            className="bg-green-600 text-white px-4 py-1.5 rounded text-sm hover:bg-green-700 disabled:opacity-50"
          >
            {saving ? 'שומר...' : 'הוסף מכשיר'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Inspection dialog ─────────────────────────────────────────────────────────
function InspectionDialog({ tool, onClose, historyCol, toolsCol, employees }) {
  const history = useMemo(() => {
    const records = [...historyCol.data]
      .filter(r => r['מספר סידורי'] === tool['מספר סידורי'])
      .sort((a, b) => (b.recordedAt || '').localeCompare(a.recordedAt || ''));

    // If no history yet, show the tool's current fields as a baseline row
    if (records.length === 0 && (tool['תאריך בדיקה'] || tool['מועד הבא'])) {
      return [{
        _baseline: true,
        'תאריך בדיקה': tool['תאריך בדיקה'] || '—',
        'מועד הבא':    tool['מועד הבא']    || '—',
        'בוצע על ידי': '—',
      }];
    }
    return records;
  }, [historyCol.data, tool]);

  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({ תאריך: today, מועד_הבא: '', בוצע_על_ידי: '', הערה: '' });
  const [nextMode, setNextMode] = useState('date');
  const [naMode, setNaMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [showList, setShowList] = useState(false);
  const [attachedFile, setAttachedFile] = useState(null);
  const [fileResetKey, setFileResetKey] = useState(0);
  const dropRef = useRef(null);

  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const computedFileName = useMemo(() => {
    if (!attachedFile) return '';
    const dateISO = naMode ? today : (form.תאריך || today);
    return buildFileName(dateISO, tool['מספר סידורי']);
  }, [attachedFile, form.תאריך, naMode, tool, today]);

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
    if (!naMode && !form.תאריך) return;
    setSaving(true);
    try {
      const realRecords = historyCol.data.filter(r => r['מספר סידורי'] === tool['מספר סידורי']);
      if (realRecords.length === 0 && (tool['תאריך בדיקה'] || tool['מועד הבא'])) {
        await historyCol.appendRow({
          'מספר סידורי': tool['מספר סידורי'],
          'שם המכשיר':   tool['שם המכשיר'],
          'תאריך בדיקה': tool['תאריך בדיקה'] || '—',
          'מועד הבא':    tool['מועד הבא']    || '—',
          'בוצע על ידי': '—',
          recordedAt:    '2000-01-01T00:00:00.000Z',
        });
      }

      const displayDate     = naMode ? 'NA' : toDisplay(form.תאריך);
      const displayNextDate = naMode ? 'לא נדרש כיול'
        : nextMode === 'note' && form.הערה.trim()
          ? form.הערה.trim()
          : form.מועד_הבא ? toDisplay(form.מועד_הבא) : tool['מועד הבא'];

      let fileUrl = '';
      let fileName = '';
      setUploadError('');
      if (attachedFile && computedFileName) {
        try {
          fileUrl = await uploadScanedDoc(attachedFile, 'tools', tool['שם המכשיר'], computedFileName);
          fileName = computedFileName;
        } catch (err) {
          setUploadError(err.message || 'העלאת הקובץ נכשלה — הרשומה נשמרה ללא קובץ');
        }
      }

      await historyCol.appendRow({
        'מספר סידורי': tool['מספר סידורי'],
        'שם המכשיר':   tool['שם המכשיר'],
        'תאריך בדיקה': displayDate,
        'מועד הבא':    displayNextDate,
        'בוצע על ידי': form.בוצע_על_ידי,
        recordedAt:    new Date().toISOString(),
        fileUrl,
        fileName,
      });

      toolsCol.setData(prev => prev.map(r =>
        r._id === tool._id
          ? { ...r, 'תאריך בדיקה': displayDate, 'מועד הבא': displayNextDate }
          : r
      ));
      await toolsCol.updateRow(tool._id, { 'תאריך בדיקה': displayDate, 'מועד הבא': displayNextDate });
      await historyCol.fetchSheet();
      setNextMode('date');
      setNaMode(false);
      setAttachedFile(null);
      setFileResetKey(k => k + 1);
      setForm({ תאריך: today, מועד_הבא: '', בוצע_על_ידי: '', הערה: '' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col" dir="rtl" onClick={e => e.stopPropagation()}>

        <div className="flex justify-between items-center px-5 py-3 border-b border-gray-200">
          <div>
            <div className="font-bold text-base">{tool['שם המכשיר']}</div>
            <div className="text-xs text-gray-500">מ. סידורי: {tool['מספר סידורי']}</div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
          <div className="font-semibold text-sm mb-3">עדכון בדיקה חדשה</div>
          <div className="flex flex-wrap gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <label className="text-xs text-gray-500">תאריך בדיקה</label>
                <label className="flex items-center gap-1 text-xs text-gray-400 cursor-pointer select-none">
                  <input type="checkbox" checked={naMode} onChange={e => setNaMode(e.target.checked)} className="cursor-pointer" />
                  NA
                </label>
              </div>
              {naMode ? (
                <div className="border border-gray-200 bg-gray-100 rounded px-2 py-1 text-sm text-gray-500 w-28">NA</div>
              ) : (
                <input type="date" value={form.תאריך}
                  onChange={e => setForm(f => ({ ...f, תאריך: e.target.value }))}
                  className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-400" dir="ltr" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <label className="text-xs text-gray-500">מועד הבא (אופציונלי)</label>
                {!naMode && (
                  <div className="flex rounded overflow-hidden border border-gray-300 text-xs">
                    <button type="button" onClick={() => setNextMode('date')}
                      className={`px-2 py-0.5 ${nextMode === 'date' ? 'bg-blue-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}>תאריך</button>
                    <button type="button" onClick={() => setNextMode('note')}
                      className={`px-2 py-0.5 ${nextMode === 'note' ? 'bg-blue-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}>הערה</button>
                  </div>
                )}
              </div>
              {naMode ? (
                <div className="border border-gray-200 bg-gray-100 rounded px-2 py-1 text-sm text-gray-500">לא נדרש כיול</div>
              ) : nextMode === 'date' ? (
                <input type="date" value={form.מועד_הבא}
                  onChange={e => setForm(f => ({ ...f, מועד_הבא: e.target.value }))}
                  className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-400" dir="ltr" />
              ) : (
                <input type="text" value={form.הערה}
                  onChange={e => setForm(f => ({ ...f, הערה: e.target.value }))}
                  placeholder="למשל: אצל ספק, בבדיקה..."
                  className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-400 w-44" />
              )}
            </div>
            <div ref={dropRef} className="relative">
              <label className="text-xs text-gray-500 block mb-1">בוצע על ידי</label>
              <div className="flex gap-1">
                <input value={form.בוצע_על_ידי}
                  onChange={e => setForm(f => ({ ...f, בוצע_על_ידי: e.target.value }))}
                  placeholder="שם הבודק"
                  className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-400 w-36" />
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
          <div className="mt-3">
            <FileDropZone
              key={fileResetKey}
              onFile={f => { setAttachedFile(f); setUploadError(''); }}
              computedFileName={computedFileName}
            />
          </div>
          {uploadError && (
            <div className="mt-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-1.5">
              {uploadError}
            </div>
          )}
          <button onClick={handleSave} disabled={saving || (!naMode && !form.תאריך)}
            className="mt-3 bg-blue-600 text-white px-4 py-1.5 rounded text-sm hover:bg-blue-700 disabled:opacity-50">
            {saving ? (attachedFile ? 'מעלה קובץ...' : 'שומר...') : 'שמור בדיקה'}
          </button>
        </div>

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
                  <th className="border border-gray-200 px-3 py-1.5 font-semibold">מסמך</th>
                </tr>
              </thead>
              <tbody>
                {history.map((r, i) => (
                  <tr key={r._id || i} className={r._baseline ? 'bg-yellow-50' : i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="border border-gray-200 px-3 py-1.5">
                      {r['תאריך בדיקה']}
                      {r._baseline && <span className="mr-2 text-xs text-yellow-700">(נתון קיים)</span>}
                    </td>
                    <td className="border border-gray-200 px-3 py-1.5">{r['מועד הבא']}</td>
                    <td className="border border-gray-200 px-3 py-1.5">{r['בוצע על ידי']}</td>
                    <td className="border border-gray-200 px-3 py-1.5 text-center">
                      {r.fileUrl
                        ? <a href={r.fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-xs hover:underline" title={r.fileName}>פתח</a>
                        : <span className="text-gray-300">—</span>}
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
export default function Tools({ autoOpen, onAutoOpened }) {
  const toolsCol   = useSheets('Tools');
  const historyCol = useSheets('ToolsHistory');
  const empCol     = useSheets('Employees');

  const [search, setSearch]           = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [activeTool, setActiveTool]   = useState(null);
  const [editTool, setEditTool]       = useState(null);
  const [togglingId, setTogglingId]   = useState(null);
  const [showAddDialog, setShowAddDialog] = useState(false);

  useEffect(() => {
    toolsCol.fetchSheet();
    historyCol.fetchSheet();
    empCol.fetchSheet();
  }, []);

  useEffect(() => {
    if (!autoOpen || toolsCol.data.length === 0) return;
    const match = toolsCol.data.find(r => (r['שם המכשיר'] || r['שם']) === autoOpen);
    if (match) setActiveTool(match);
    onAutoOpened?.();
  }, [autoOpen, toolsCol.data]);

  const employees = useMemo(() =>
    empCol.data.map(r => r['שם'] || Object.values(r).find(v => v && v !== r._id)).filter(Boolean),
    [empCol.data]
  );

  async function handleDeactivate(row) {
    setTogglingId(row._id);
    try {
      toolsCol.setData(prev => prev.map(r => r._id === row._id ? { ...r, 'מועד הבא': 'לא בשימוש' } : r));
      await toolsCol.updateRow(row._id, { 'מועד הבא': 'לא בשימוש' });
    } finally {
      setTogglingId(null);
    }
  }

  async function handleAddTool(data) {
    await toolsCol.appendRow(data);
    await toolsCol.fetchSheet();
  }

  async function handleEditTool(id, data) {
    toolsCol.setData(prev => prev.map(r => r._id === id ? { ...r, ...data } : r));
    await toolsCol.updateRow(id, data);
  }

  const filtered = useMemo(() => {
    const seen = new Set();
    return toolsCol.data
      .filter(r => {
        const num = String(r['#'] ?? '');
        if (num && seen.has(num)) return false;
        if (num) seen.add(num);
        return true;
      })
      .map(r => ({ ...r, _status: calcStatus(r['מועד הבא'], 'tools') }))
      .filter(r => {
        const q = search.toLowerCase();
        const matchSearch = !q || (r['שם המכשיר'] || '').toLowerCase().includes(q) || (r['מספר סידורי'] || '').toLowerCase().includes(q);
        const matchStatus = filterStatus === 'all' || r._status === filterStatus;
        return matchSearch && matchStatus;
      });
  }, [toolsCol.data, search, filterStatus]);

  const { sorted: rows, sort, toggleSort } = useSortable(filtered);

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
          onClick={() => setShowAddDialog(true)}
          className="bg-green-600 text-white px-4 py-1.5 rounded text-sm hover:bg-green-700"
        >
          + הוסף מכשיר
        </button>
        <button
          onClick={() => exportTablePDF('tools', cols, rows.map(r => cols.map(c => c === 'סטטוס' ? r._status : (r[c] ?? ''))))}
          className="mr-auto bg-blue-600 text-white px-4 py-1.5 rounded text-sm hover:bg-blue-700"
        >
          ייצוא PDF
        </button>
      </div>

      {toolsCol.loading && <div className="text-center text-gray-400 py-4">טוען...</div>}
      {toolsCol.error && <div className="text-red-500 text-sm mb-3">{toolsCol.error}</div>}

      <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-[#D9D9D9] text-right">
            <SortableHeader col="#"            label="#"            sort={sort} onSort={toggleSort} />
            <SortableHeader col="שם המכשיר"   label="שם המכשיר"   sort={sort} onSort={toggleSort} />
            <SortableHeader col="מספר סידורי"  label="מספר סידורי"  sort={sort} onSort={toggleSort} />
            <SortableHeader col="תאריך בדיקה"  label="תאריך בדיקה"  sort={sort} onSort={toggleSort} />
            <SortableHeader col="מועד הבא"     label="מועד הבא"     sort={sort} onSort={toggleSort} />
            <SortableHeader col="מיקום"         label="מיקום"         sort={sort} onSort={toggleSort} />
            <SortableHeader col="_status"       label="סטטוס"         sort={sort} onSort={toggleSort} />
            <th className="border border-[#999] px-2 py-2 font-bold">פעולות</th>
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
                  <button
                    onClick={() => setEditTool(r)}
                    className="text-gray-500 text-xs hover:text-blue-600 hover:underline whitespace-nowrap"
                  >
                    ערוך פרטים
                  </button>
                  {r._status === 'gray' ? (
                    <button onClick={() => setActiveTool(r)}
                      className="text-green-700 text-xs hover:underline whitespace-nowrap">
                      הפעל
                    </button>
                  ) : (
                    <button onClick={() => handleDeactivate(r)} disabled={togglingId === r._id}
                      className="text-gray-400 text-xs hover:text-red-500 hover:underline whitespace-nowrap disabled:opacity-50">
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
      </div>

      {activeTool && (
        <InspectionDialog
          tool={activeTool}
          onClose={() => setActiveTool(null)}
          historyCol={historyCol}
          toolsCol={toolsCol}
          employees={employees}
        />
      )}

      {editTool && (
        <EditToolDialog
          tool={editTool}
          onClose={() => setEditTool(null)}
          onSave={handleEditTool}
        />
      )}

      {showAddDialog && (
        <AddToolDialog
          onClose={() => setShowAddDialog(false)}
          onSave={handleAddTool}
        />
      )}
    </div>
  );
}
