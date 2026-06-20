import { useEffect, useState, useMemo, useRef } from 'react';
import DocHeader from '../components/DocHeader';
import StatusBadge from '../components/StatusBadge';
import SortableHeader from '../components/SortableHeader';
import { useCollection as useSheets } from '../hooks/useCollection';
import { calcFilterStatus } from '../hooks/useStatus';
import { useSortable } from '../hooks/useSortable';
import { exportTablePDF } from '../utils/exportPDF';
import { parseDate, formatDate, latestUpdate } from '../utils/dateUtils';
import { uploadScanedDoc } from '../utils/fileUpload';

const IMG_TYPES = ['image/jpeg','image/jpg','image/png','image/webp'];
function isImg(f) { return IMG_TYPES.includes(f.type) || ['.jpg','.jpeg','.png','.webp'].includes('.'+f.name.split('.').pop().toLowerCase()); }
async function uploadFilterImage(file, filterNum) {
  const clean = String(filterNum||'filter').replace(/[^a-zA-Z0-9א-ת_-]/g,'_').replace(/_+/g,'_').replace(/^_|_$/g,'');
  return uploadScanedDoc(file, 'filters/images', clean, `photo_${clean}`);
}
function ImageLightbox({ src, onClose }) {
  useEffect(() => { const h=e=>{if(e.key==='Escape')onClose();}; window.addEventListener('keydown',h); return()=>window.removeEventListener('keydown',h); },[onClose]);
  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[60] p-4" onClick={onClose}>
      <img src={src} alt="" className="max-w-full max-h-full rounded shadow-2xl object-contain" onClick={e=>e.stopPropagation()} />
      <button onClick={onClose} className="absolute top-4 left-4 text-white text-3xl leading-none hover:text-gray-300">×</button>
    </div>
  );
}

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

function calcNextDate(lastDateStr, frequency) {
  if (!lastDateStr || !frequency) return '';
  if (['לא נדרש', 'לא בשימוש', '-', ''].includes(String(frequency).trim())) return '';
  const d = parseDate(lastDateStr);
  if (!d) return '';
  const next = new Date(d);
  next.setDate(next.getDate() + 90);
  return formatDate(next);
}

// ── Edit filter details dialog ─────────────────────────────────────────────────
function EditFilterDialog({ filter, filtersCol, onClose }) {
  const [form, setForm] = useState({
    'מ. פילטר': filter['מ. פילטר'] || '',
    'מכונה':    filter['מכונה']    || '',
    'מ. מכונה': filter['מ. מכונה'] || '',
    'מיקום':    filter['מיקום']    || '',
    'תדירות':   filter['תדירות']   || '',
  });
  const [saving, setSaving] = useState(false);
  const [imgFile, setImgFile] = useState(null);
  const [imgPreview, setImgPreview] = useState(filter['imageUrl'] || '');
  const [imgError, setImgError] = useState('');
  const imgInputRef = useRef(null);

  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  function handleImgChange(e) {
    const f = e.target.files[0];
    if (!f) return;
    if (!isImg(f)) { setImgError('סוג קובץ לא נתמך — JPG, PNG או WEBP בלבד'); return; }
    setImgError(''); setImgFile(f); setImgPreview(URL.createObjectURL(f));
  }

  async function handleSave() {
    setSaving(true);
    let imageUrl = imgPreview ? (filter['imageUrl'] || '') : '';
    if (imgFile) {
      try { imageUrl = await uploadFilterImage(imgFile, form['מ. פילטר'] || filter['מ. פילטר']); }
      catch (err) { setImgError(err.message || 'העלאת התמונה נכשלה'); setSaving(false); return; }
    }
    const updated = { ...form, imageUrl };
    await filtersCol.updateRow(filter._id, updated);
    filtersCol.setData(prev => prev.map(r => r._id === filter._id ? { ...r, ...updated } : r));
    setSaving(false);
    onClose(updated);
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded shadow-xl w-full max-w-md" dir="rtl" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center px-5 py-3 border-b border-gray-200">
          <div className="font-bold text-base">עריכת פרטי פילטר</div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>
        <div className="px-5 py-4 flex flex-col gap-3">
          {[['מ. פילטר', 'מספר פילטר'], ['מכונה', 'שם מכונה'], ['מ. מכונה', 'מ. מכונה'], ['מיקום', 'מיקום'], ['תדירות', 'תדירות']].map(([field, label]) => (
            <div key={field}>
              <label className="text-xs text-gray-500 block mb-1">{label}</label>
              <input value={form[field]} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                className="border border-gray-300 rounded px-2 py-1.5 text-sm w-full focus:outline-none focus:border-blue-400" />
            </div>
          ))}
          <div>
            <label className="text-xs text-gray-500 block mb-1">תמונת פילטר (JPG / PNG)</label>
            <div className="flex items-center gap-3">
              {imgPreview && <img src={imgPreview} alt="" className="w-14 h-14 object-cover rounded border border-gray-200 shrink-0" />}
              <button type="button" onClick={() => imgInputRef.current?.click()}
                className="border border-gray-300 rounded px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50">
                {imgPreview ? 'החלף תמונה' : 'בחר תמונה'}
              </button>
              {imgPreview && <button type="button" onClick={() => { setImgFile(null); setImgPreview(''); }} className="text-red-400 hover:text-red-600 text-sm">הסר</button>}
              <input ref={imgInputRef} type="file" accept=".jpg,.jpeg,.png,.webp" onChange={handleImgChange} className="hidden" />
            </div>
            {imgError && <div className="mt-1 text-xs text-red-600">{imgError}</div>}
          </div>
        </div>
        <div className="px-5 pb-4 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-1.5 rounded text-sm border border-gray-300 hover:bg-gray-50">ביטול</button>
          <button onClick={handleSave} disabled={saving}
            className="bg-blue-600 text-white px-4 py-1.5 rounded text-sm hover:bg-blue-700 disabled:opacity-50">
            {saving ? (imgFile ? 'מעלה תמונה...' : 'שומר...') : 'שמור'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Filter update + history dialog ────────────────────────────────────────────
function FilterDialog({ filter, onClose, historyCol, filtersCol, uniqueFreqs }) {
  const [deletingId, setDeletingId] = useState(null);

  const history = useMemo(() => {
    const records = [...historyCol.data]
      .filter(r => r.filter_id === filter._id)
      .sort((a, b) => (b.recordedAt || '').localeCompare(a.recordedAt || ''));

    if (records.length === 0 && filter['תאריך אחרון']) {
      return [{
        _baseline: true,
        'תאריך אחרון': filter['תאריך אחרון'],
        'תדירות':      filter['תדירות'] || '—',
        'בוצע על ידי': '—',
        recordedAt: '',
      }];
    }
    return records;
  }, [historyCol.data, filter]);

  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({
    תאריך_אחרון: toISO(filter['תאריך אחרון']) || today,
    תדירות:      filter['תדירות'] || '',
    בוצע_על_ידי: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  async function handleSave() {
    setSaving(true);

    const realRecords = historyCol.data.filter(r => r.filter_id === filter._id);
    if (realRecords.length === 0 && filter['תאריך אחרון']) {
      await historyCol.appendRow({
        filter_id:      filter._id,
        'מ. פילטר':    filter['מ. פילטר'],
        'תאריך אחרון': filter['תאריך אחרון'],
        'תדירות':      filter['תדירות'] || '—',
        'בוצע על ידי': '—',
        recordedAt:    '2000-01-01T00:00:00.000Z',
      });
    }

    const displayDate = toDisplay(form.תאריך_אחרון);
    await historyCol.appendRow({
      filter_id:      filter._id,
      'מ. פילטר':    filter['מ. פילטר'],
      'תאריך אחרון': displayDate,
      'תדירות':      form.תדירות || '—',
      'בוצע על ידי': form.בוצע_על_ידי || '—',
      recordedAt:    new Date().toISOString(),
    });

    await filtersCol.updateRow(filter._id, { 'תאריך אחרון': displayDate, 'תדירות': form.תדירות });
    filtersCol.setData(prev => prev.map(r =>
      r._id === filter._id
        ? { ...r, 'תאריך אחרון': displayDate, 'תדירות': form.תדירות }
        : r
    ));
    await historyCol.fetchSheet();
    setSaving(false);
    setForm({ תאריך_אחרון: form.תאריך_אחרון, תדירות: form.תדירות, בוצע_על_ידי: '' });
  }

  async function handleDeleteHistory(record) {
    if (!record._id || record._baseline) return;
    if (!window.confirm('למחוק שורה זו מההיסטוריה?')) return;
    setDeletingId(record._id);
    await historyCol.deleteRow(record._id);
    historyCol.setData(prev => prev.filter(r => r._id !== record._id));
    setDeletingId(null);
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col" dir="rtl" onClick={e => e.stopPropagation()}>

        <div className="flex justify-between items-center px-5 py-3 border-b border-gray-200">
          <div>
            <div className="font-bold text-base">פילטר {filter['מ. פילטר']}</div>
            <div className="text-xs text-gray-500">
              {filter['מכונה']} · {filter['מיקום']} · תדירות: {filter['תדירות']}
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
          <div className="font-semibold text-sm mb-3">רישום החלפה / ניקוי</div>
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="text-xs text-gray-500 block mb-1">תאריך ביצוע</label>
              <input type="date" value={form.תאריך_אחרון}
                onChange={e => setForm(f => ({ ...f, תאריך_אחרון: e.target.value }))}
                className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-400" dir="ltr" />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">תדירות</label>
              <input
                list="freq-list"
                value={form.תדירות}
                onChange={e => setForm(f => ({ ...f, תדירות: e.target.value }))}
                placeholder="בחר או כתוב..."
                className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-400 w-36"
              />
              <datalist id="freq-list">
                {uniqueFreqs.map(f => <option key={f} value={f} />)}
              </datalist>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">בוצע על ידי</label>
              <input value={form.בוצע_על_ידי}
                onChange={e => setForm(f => ({ ...f, בוצע_על_ידי: e.target.value }))}
                placeholder="שם המבצע"
                className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-400 w-40" />
            </div>
          </div>
          <button onClick={handleSave} disabled={saving || !form.תאריך_אחרון}
            className="mt-3 bg-blue-600 text-white px-4 py-1.5 rounded text-sm hover:bg-blue-700 disabled:opacity-50">
            {saving ? 'שומר...' : 'שמור'}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-3">
          <div className="font-semibold text-sm mb-2">היסטוריה</div>
          {historyCol.loading && <div className="text-gray-400 text-sm">טוען...</div>}
          {!historyCol.loading && history.length === 0 && (
            <div className="text-gray-400 text-sm">אין רשומות קודמות</div>
          )}
          {history.length > 0 && (
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-100 text-right">
                  <th className="border border-gray-200 px-3 py-1.5 font-semibold">תאריך ביצוע</th>
                  <th className="border border-gray-200 px-3 py-1.5 font-semibold">תדירות</th>
                  <th className="border border-gray-200 px-3 py-1.5 font-semibold">בוצע על ידי</th>
                  <th className="border border-gray-200 px-3 py-1.5 font-semibold">נרשם בתאריך</th>
                  <th className="border border-gray-200 px-2 py-1.5 font-semibold w-8"></th>
                </tr>
              </thead>
              <tbody>
                {history.map((r, i) => (
                  <tr key={r._id || i} className={r._baseline ? 'bg-yellow-50' : i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="border border-gray-200 px-3 py-1.5">
                      {r['תאריך אחרון']}
                      {r._baseline && <span className="mr-2 text-xs text-yellow-700">(נתון קיים)</span>}
                    </td>
                    <td className="border border-gray-200 px-3 py-1.5">{r['תדירות']}</td>
                    <td className="border border-gray-200 px-3 py-1.5">{r['בוצע על ידי']}</td>
                    <td className="border border-gray-200 px-3 py-1.5 text-gray-400 text-xs" dir="ltr">
                      {r.recordedAt && r.recordedAt !== '2000-01-01T00:00:00.000Z'
                        ? new Date(r.recordedAt).toLocaleDateString('he-IL')
                        : '—'}
                    </td>
                    <td className="border border-gray-200 px-2 py-1.5 text-center">
                      {!r._baseline && (
                        <button
                          onClick={() => handleDeleteHistory(r)}
                          disabled={deletingId === r._id}
                          title="מחק שורה"
                          className="text-red-400 hover:text-red-600 text-base leading-none disabled:opacity-40"
                        >
                          ×
                        </button>
                      )}
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
export default function Filters({ autoOpen, onAutoOpened }) {
  const filtersCol = useSheets('Filters');
  const historyCol = useSheets('FiltersHistory');
  const [activeFilter, setActiveFilter] = useState(null);
  const [editFilter, setEditFilter] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [lightboxSrc, setLightboxSrc] = useState(null);

  useEffect(() => {
    filtersCol.fetchSheet();
    historyCol.fetchSheet();
  }, []);

  useEffect(() => {
    if (!autoOpen || filtersCol.data.length === 0) return;
    const match = filtersCol.data.find(r =>
      `${r['מ. פילטר']} — ${r['מכונה']}` === autoOpen || r['מ. פילטר'] === autoOpen
    );
    if (match) setActiveFilter(match);
    onAutoOpened?.();
  }, [autoOpen, filtersCol.data]);

  const uniqueFreqs = useMemo(() =>
    [...new Set(filtersCol.data.map(r => r['תדירות']).filter(Boolean))].sort(),
    [filtersCol.data]);

  const lastUpdate = useMemo(() => latestUpdate(historyCol.data), [historyCol.data]);

  const filtered = useMemo(() => {
    const withStatus = filtersCol.data.map(r => ({
      ...r,
      _status:   calcFilterStatus(r['תאריך אחרון'], r['תדירות']),
      _nextDate: calcNextDate(r['תאריך אחרון'], r['תדירות']),
    }));
    if (filterStatus === 'all') return withStatus;
    return withStatus.filter(r => r._status === filterStatus);
  }, [filtersCol.data, filterStatus]);

  const { sorted: rows, sort, toggleSort } = useSortable(filtered);

  async function handleDeleteFilter(row) {
    if (!window.confirm(`למחוק את פילטר "${row['מ. פילטר']}"?\nכל ההיסטוריה שלו תימחק גם כן.`)) return;
    const historyIds = historyCol.data.filter(r => r.filter_id === row._id).map(r => r._id);
    await filtersCol.deleteRow(row._id);
    await Promise.all(historyIds.map(id => historyCol.deleteRow(id)));
    filtersCol.setData(prev => prev.filter(r => r._id !== row._id));
    historyCol.setData(prev => prev.filter(r => r.filter_id !== row._id));
  }

  const cols = ['מ. פילטר', 'מכונה', 'מ. מכונה', 'מיקום', 'תדירות', 'תאריך אחרון', 'תאריך הבא', 'סטטוס'];

  return (
    <div>
      <DocHeader tab="filters" lastUpdate={lastUpdate} />
      <div className="flex flex-wrap gap-2 mb-3 items-center">
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
          onClick={() => exportTablePDF('filters', cols, rows.map(r =>
            cols.map(c => {
              if (c === 'סטטוס') return r._status;
              if (c === 'תאריך הבא') return r._nextDate ?? '';
              return r[c] ?? '';
            })
          ))}
          className="mr-auto bg-blue-600 text-white px-4 py-1.5 rounded text-sm hover:bg-blue-700"
        >
          ייצוא PDF
        </button>
      </div>
      {filtersCol.loading && <div className="text-center text-gray-400 py-4">טוען...</div>}
      {filtersCol.error && <div className="text-red-500 text-sm mb-3">{filtersCol.error}</div>}
      <div className="overflow-x-auto">
      <table className="w-full min-w-[900px] text-sm border-collapse">
        <thead>
          <tr className="bg-[#D9D9D9] text-right">
            <SortableHeader col="מ. פילטר"     label="מ. פילטר"     sort={sort} onSort={toggleSort} />
            <SortableHeader col="מכונה"         label="מכונה"         sort={sort} onSort={toggleSort} />
            <th className="border border-[#999] px-2 py-2 font-bold">תמונה</th>
            <SortableHeader col="מ. מכונה"     label="מ. מכונה"     sort={sort} onSort={toggleSort} />
            <SortableHeader col="מיקום"         label="מיקום"         sort={sort} onSort={toggleSort} />
            <SortableHeader col="תדירות"        label="תדירות"        sort={sort} onSort={toggleSort} />
            <SortableHeader col="תאריך אחרון"   label="תאריך אחרון"   sort={sort} onSort={toggleSort} />
            <SortableHeader col="_nextDate"     label="תאריך הבא"     sort={sort} onSort={toggleSort} />
            <SortableHeader col="_status"       label="סטטוס"         sort={sort} onSort={toggleSort} />
            <th className="border border-[#999] px-2 py-2 font-bold">פעולות</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r._id || i} className={i % 2 === 0 ? 'bg-white' : 'bg-[#FAFAFA]'}>
              <td className="border border-[#999] px-3 py-1.5">{r['מ. פילטר']}</td>
              <td className="border border-[#999] px-3 py-1.5">{r['מכונה']}</td>
              <td className="border border-[#999] px-2 py-1.5 text-center">
                {r['imageUrl'] ? (
                  <img src={r['imageUrl']} alt="" onClick={() => setLightboxSrc(r['imageUrl'])}
                    className="w-16 h-16 object-cover rounded cursor-pointer hover:opacity-80 mx-auto" title="לחץ להגדלה" />
                ) : <span className="text-gray-300 text-xs">—</span>}
              </td>
              <td className="border border-[#999] px-3 py-1.5">{r['מ. מכונה']}</td>
              <td className="border border-[#999] px-3 py-1.5">{r['מיקום']}</td>
              <td className="border border-[#999] px-3 py-1.5">{r['תדירות']}</td>
              <td className="border border-[#999] px-3 py-1.5">{r['תאריך אחרון']}</td>
              <td className="border border-[#999] px-3 py-1.5">{r._nextDate}</td>
              <td className="border border-[#999] px-3 py-1.5"><StatusBadge status={r._status} /></td>
              <td className="border border-[#999] px-2 py-1.5 text-center whitespace-nowrap">
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => setActiveFilter(r)}
                    className="text-blue-600 text-xs hover:underline whitespace-nowrap"
                  >
                    עדכן / היסטוריה
                  </button>
                  <button
                    onClick={() => setEditFilter(r)}
                    title="עריכה"
                    className="text-gray-400 hover:text-blue-600 leading-none"
                    style={{fontSize: '11px'}}
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDeleteFilter(r)}
                    title="מחק שורה"
                    className="text-gray-300 hover:text-red-500 text-base leading-none"
                  >
                    ×
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {rows.length === 0 && !filtersCol.loading && (
            <tr><td colSpan={10} className="text-center py-4 text-gray-400">אין תוצאות</td></tr>
          )}
        </tbody>
      </table>
      </div>

      {activeFilter && (
        <FilterDialog
          filter={activeFilter}
          onClose={() => setActiveFilter(null)}
          historyCol={historyCol}
          filtersCol={filtersCol}
          uniqueFreqs={uniqueFreqs}
        />
      )}

      {editFilter && (
        <EditFilterDialog
          filter={editFilter}
          filtersCol={filtersCol}
          onClose={updatedForm => {
            if (updatedForm && activeFilter?._id === editFilter._id) {
              setActiveFilter(prev => prev ? { ...prev, ...updatedForm } : prev);
            }
            setEditFilter(null);
          }}
        />
      )}

      {lightboxSrc && <ImageLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />}
    </div>
  );
}
