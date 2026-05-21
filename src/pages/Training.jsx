import { useEffect, useState, useRef } from 'react';
import DocHeader from '../components/DocHeader';
import { useCollection } from '../hooks/useCollection';
import { exportTablePDF } from '../utils/exportPDF';
import { todayFormatted } from '../utils/dateUtils';

const DEFAULT_TOPICS = [
  { נושא: 'ריענון בטיחות ליד מערכות לייזר',  מסמכים: 'נוהל בטיחות בלייזר REV02' },
  { נושא: 'מדיניות איכות + FOD',              מסמכים: 'QP-4.2.2, QP-5.3-1' },
  { נושא: 'נוהל חדר נקי',                     מסמכים: 'SH150421, SH260421, SH06102021' },
  { נושא: 'הדרכה על ביקורות QC',              מסמכים: 'QP-7.4.3.1, QP-7.5.1-1, QP-8.3.1-1' },
  { נושא: 'הדרכה לפי לקוחות',                 מסמכים: 'QP-8.3.1-1, QP-7.5.1-1' },
];

const DEFAULT_EMPLOYEES = ['סבטלנה מטבייב', 'דני שהם', 'איציק נוסם', 'אילנה הופמן', 'סגי ישראל'];

function TrainerCell({ value, employees, onChange }) {
  const [showList, setShowList] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(e) { if (ref.current && !ref.current.contains(e.target)) setShowList(false); }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <div className="flex gap-1">
        <input
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="שם מדריך"
          className="w-full bg-transparent px-2 py-0.5 focus:outline-none focus:bg-blue-50 rounded text-sm border border-transparent focus:border-blue-300"
        />
        <button
          type="button"
          onClick={() => setShowList(s => !s)}
          className="text-gray-400 hover:text-blue-600 px-1 text-xs"
          title="בחר מרשימה"
        >▼</button>
      </div>
      {showList && (
        <div className="absolute top-full right-0 bg-white border border-gray-200 rounded shadow-lg z-20 min-w-[140px] py-1">
          {employees.map(e => (
            <button
              key={e}
              onClick={() => { onChange(e); setShowList(false); }}
              className="block w-full text-right px-3 py-1.5 text-sm hover:bg-blue-50"
            >
              {e}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Training() {
  const employeesSheet = useCollection('Employees');
  const historySheet   = useCollection('TrainingHistory');

  const [view, setView]               = useState('active'); // 'active' | 'history'
  const [topics, setTopics]           = useState(DEFAULT_TOPICS.map(t => ({ ...t, מדריך: '', תאריך: '', בוצע: false, משתתפים: [] })));
  const [employees, setEmployees]     = useState(DEFAULT_EMPLOYEES);
  const [newEmployee, setNewEmployee] = useState('');
  const [dialogTopic, setDialogTopic] = useState(null);
  const [tempSelected, setTempSelected] = useState([]);
  const [confirmingIdx, setConfirmingIdx] = useState(null);

  useEffect(() => {
    employeesSheet.fetchSheet();
    historySheet.fetchSheet();
  }, []);

  useEffect(() => {
    if (employeesSheet.data.length > 0)
      setEmployees(employeesSheet.data.map(r => r['שם'] || Object.values(r).find(v => v && v !== r._id)).filter(Boolean));
  }, [employeesSheet.data]);

  function updateTopic(i, field, val) {
    setTopics(prev => prev.map((t, idx) => idx === i ? { ...t, [field]: val } : t));
  }

  function openDialog(i) { setDialogTopic(i); setTempSelected([...topics[i].משתתפים]); }
  function toggleEmployee(name) { setTempSelected(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]); }
  function saveDialog() { updateTopic(dialogTopic, 'משתתפים', tempSelected); setDialogTopic(null); }

  function addEmployee() {
    const name = newEmployee.trim();
    if (name && !employees.includes(name)) { setEmployees(prev => [...prev, name]); setNewEmployee(''); }
  }

  function removeEmployee(name) {
    setEmployees(prev => prev.filter(e => e !== name));
    setTopics(prev => prev.map(t => ({ ...t, משתתפים: t.משתתפים.filter(e => e !== name) })));
  }

  async function confirmTraining(i) {
    const t = topics[i];
    setConfirmingIdx(i);
    try {
      await historySheet.appendRow({
        נושא:        t.נושא,
        מסמכים:      t.מסמכים,
        משתתפים:     t.משתתפים,
        מדריך:       t.מדריך,
        תאריך:       t.תאריך,
        confirmedAt: new Date().toISOString(),
      });
      // reload history list
      await historySheet.fetchSheet();
      // reset this row
      setTopics(prev => prev.map((row, idx) =>
        idx === i ? { ...row, מדריך: '', תאריך: '', בוצע: false, משתתפים: [] } : row
      ));
    } finally {
      setConfirmingIdx(null);
    }
  }

  async function deleteHistory(docId) {
    await historySheet.deleteRow(docId);
    historySheet.setData(prev => prev.filter(r => r._id !== docId));
  }

  const sortedHistory = [...historySheet.data].sort((a, b) =>
    (b.confirmedAt || '').localeCompare(a.confirmedAt || '')
  );

  const exportCols = ['נושא', 'מסמכים', 'משתתפים', 'מדריך', 'תאריך', 'בוצע'];

  return (
    <div>
      <DocHeader tab="training" />

      {/* View toggle */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setView('active')}
          className={`px-4 py-1.5 rounded text-sm font-medium border ${view === 'active' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}
        >
          הדרכות פעילות
        </button>
        <button
          onClick={() => { setView('history'); historySheet.fetchSheet(); }}
          className={`px-4 py-1.5 rounded text-sm font-medium border ${view === 'history' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}
        >
          היסטוריית הדרכות {historySheet.data.length > 0 && `(${historySheet.data.length})`}
        </button>
      </div>

      {view === 'active' && (
        <>
          {/* Employees panel */}
          <div className="border border-gray-200 rounded p-3 mb-4 bg-gray-50">
            <div className="font-semibold text-sm mb-2">רשימת עובדים</div>
            <div className="flex flex-wrap gap-2 mb-3">
              {employees.map(e => (
                <span key={e} className="inline-flex items-center gap-1 bg-white border border-gray-300 rounded px-2 py-0.5 text-sm">
                  {e}
                  <button
                    onClick={() => removeEmployee(e)}
                    className="text-gray-400 hover:text-red-500 leading-none text-xs font-bold"
                    title="הסר עובד"
                  >×</button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={newEmployee}
                onChange={e => setNewEmployee(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addEmployee()}
                placeholder="הוסף עובד..."
                className="border border-gray-300 rounded px-3 py-1 text-sm focus:outline-none focus:border-blue-400"
              />
              <button onClick={addEmployee} className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700">הוסף</button>
            </div>
          </div>

          <div className="flex justify-end mb-3">
            <button
              onClick={() => exportTablePDF('training', exportCols, topics.map(t => [t.נושא, t.מסמכים, t.משתתפים.join(', '), t.מדריך, t.תאריך, t.בוצע ? '✓' : '']))}
              className="bg-blue-600 text-white px-4 py-1.5 rounded text-sm hover:bg-blue-700"
            >
              ייצוא PDF
            </button>
          </div>

          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-[#D9D9D9] text-right">
                <th className="border border-[#999] px-3 py-2 font-bold">נושא הדרכה</th>
                <th className="border border-[#999] px-3 py-2 font-bold">מסמכים</th>
                <th className="border border-[#999] px-3 py-2 font-bold">משתתפים</th>
                <th className="border border-[#999] px-3 py-2 font-bold">מדריך</th>
                <th className="border border-[#999] px-3 py-2 font-bold">תאריך</th>
                <th className="border border-[#999] px-3 py-2 font-bold">בוצע</th>
                <th className="border border-[#999] px-3 py-2 font-bold">אישור</th>
              </tr>
            </thead>
            <tbody>
              {topics.map((t, i) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-[#FAFAFA]'}>
                  <td className="border border-[#999] px-3 py-1.5 font-medium">{t.נושא}</td>
                  <td className="border border-[#999] px-3 py-1.5 text-xs text-gray-600">{t.מסמכים}</td>
                  <td className="border border-[#999] px-2 py-1.5">
                    <div className="flex flex-wrap gap-1 mb-1">
                      {t.משתתפים.map(e => <span key={e} className="bg-blue-50 border border-blue-200 rounded px-1.5 text-xs">{e}</span>)}
                    </div>
                    <button onClick={() => openDialog(i)} className="text-blue-600 text-xs hover:underline">בחר משתתפים</button>
                  </td>
                  <td className="border border-[#999] px-1 py-1 min-w-[130px]">
                    <TrainerCell
                      value={t.מדריך}
                      employees={employees}
                      onChange={val => updateTopic(i, 'מדריך', val)}
                    />
                  </td>
                  <td className="border border-[#999] px-1 py-1">
                    <input type="date" value={t.תאריך} onChange={e => updateTopic(i, 'תאריך', e.target.value)}
                      className="bg-transparent focus:outline-none focus:bg-blue-50 rounded text-sm" dir="ltr" />
                  </td>
                  <td className="border border-[#999] px-3 py-1.5 text-center">
                    <input type="checkbox" checked={t.בוצע} onChange={e => updateTopic(i, 'בוצע', e.target.checked)} className="w-4 h-4" />
                  </td>
                  <td className="border border-[#999] px-2 py-1.5 text-center">
                    {t.בוצע && t.תאריך ? (
                      <button
                        onClick={() => confirmTraining(i)}
                        disabled={confirmingIdx === i}
                        className="bg-green-600 text-white px-3 py-0.5 rounded text-xs hover:bg-green-700 disabled:opacity-50"
                      >
                        {confirmingIdx === i ? '...' : 'אשר'}
                      </button>
                    ) : (
                      <span className="text-gray-300 text-xs">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {view === 'history' && (
        <>
          <div className="flex justify-between items-center mb-3">
            <div className="text-sm text-gray-500">{sortedHistory.length} הדרכות בהיסטוריה</div>
            <button
              onClick={() => exportTablePDF('training', ['נושא', 'מסמכים', 'משתתפים', 'מדריך', 'תאריך', 'תאריך אישור'],
                sortedHistory.map(r => [r.נושא, r.מסמכים, (r.משתתפים || []).join(', '), r.מדריך, r.תאריך,
                  r.confirmedAt ? new Date(r.confirmedAt).toLocaleDateString('he-IL') : '']))}
              className="bg-blue-600 text-white px-4 py-1.5 rounded text-sm hover:bg-blue-700"
            >
              ייצוא PDF
            </button>
          </div>

          {historySheet.loading && <div className="text-center text-gray-500 py-8">טוען...</div>}

          {!historySheet.loading && sortedHistory.length === 0 && (
            <div className="text-center text-gray-400 py-12 text-sm">אין הדרכות מאושרות עדיין</div>
          )}

          {sortedHistory.length > 0 && (
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-[#D9D9D9] text-right">
                  <th className="border border-[#999] px-3 py-2 font-bold">נושא הדרכה</th>
                  <th className="border border-[#999] px-3 py-2 font-bold">מסמכים</th>
                  <th className="border border-[#999] px-3 py-2 font-bold">משתתפים</th>
                  <th className="border border-[#999] px-3 py-2 font-bold">מדריך</th>
                  <th className="border border-[#999] px-3 py-2 font-bold">תאריך הדרכה</th>
                  <th className="border border-[#999] px-3 py-2 font-bold">תאריך אישור</th>
                  <th className="border border-[#999] px-2 py-2 font-bold w-10"></th>
                </tr>
              </thead>
              <tbody>
                {sortedHistory.map((r, i) => (
                  <tr key={r._id} className={i % 2 === 0 ? 'bg-white' : 'bg-[#FAFAFA]'}>
                    <td className="border border-[#999] px-3 py-1.5 font-medium">{r.נושא}</td>
                    <td className="border border-[#999] px-3 py-1.5 text-xs text-gray-600">{r.מסמכים}</td>
                    <td className="border border-[#999] px-2 py-1.5">
                      <div className="flex flex-wrap gap-1">
                        {(r.משתתפים || []).map(e => (
                          <span key={e} className="bg-blue-50 border border-blue-200 rounded px-1.5 text-xs">{e}</span>
                        ))}
                      </div>
                    </td>
                    <td className="border border-[#999] px-3 py-1.5">{r.מדריך}</td>
                    <td className="border border-[#999] px-3 py-1.5 text-center" dir="ltr">{r.תאריך}</td>
                    <td className="border border-[#999] px-3 py-1.5 text-center text-xs text-gray-500" dir="ltr">
                      {r.confirmedAt ? new Date(r.confirmedAt).toLocaleDateString('he-IL') : ''}
                    </td>
                    <td className="border border-[#999] px-2 py-1.5 text-center">
                      <button
                        onClick={() => deleteHistory(r._id)}
                        className="text-gray-300 hover:text-red-500 text-xs font-bold"
                        title="מחק"
                      >×</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}

      {/* Participants dialog */}
      {dialogTopic !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded shadow-xl p-6 w-80">
            <div className="font-bold mb-3">בחר משתתפים</div>
            <div className="flex gap-2 mb-3">
              <button onClick={() => setTempSelected([...employees])} className="text-xs text-blue-600 hover:underline">בחר הכל</button>
              <button onClick={() => setTempSelected([])} className="text-xs text-gray-500 hover:underline">נקה הכל</button>
            </div>
            <div className="space-y-1 max-h-48 overflow-y-auto mb-4">
              {employees.map(e => (
                <label key={e} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={tempSelected.includes(e)} onChange={() => toggleEmployee(e)} />
                  {e}
                </label>
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setDialogTopic(null)} className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded">ביטול</button>
              <button onClick={saveDialog} className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">אישור</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
