import { useEffect, useState } from 'react';
import DocHeader from '../components/DocHeader';
import { useSheets } from '../hooks/useSheets';
import { exportTablePDF } from '../utils/exportPDF';

const DEFAULT_TOPICS = [
  { נושא: 'ריענון בטיחות ליד מערכות לייזר',  מסמכים: 'נוהל בטיחות בלייזר REV02' },
  { נושא: 'מדיניות איכות + FOD',              מסמכים: 'QP-4.2.2, QP-5.3-1' },
  { נושא: 'נוהל חדר נקי',                     מסמכים: 'SH150421, SH260421, SH06102021' },
  { נושא: 'הדרכה על ביקורות QC',              מסמכים: 'QP-7.4.3.1, QP-7.5.1-1, QP-8.3.1-1' },
  { נושא: 'הדרכה לפי לקוחות',                 מסמכים: 'QP-8.3.1-1, QP-7.5.1-1' },
];

const DEFAULT_EMPLOYEES = ['סבטלנה מטבייב', 'דני שהם', 'איציק נוסם', 'אילנה הופמן', 'סגי ישראל'];

export default function Training() {
  const trainingSheet = useSheets('Training');
  const employeesSheet = useSheets('Employees');

  const [topics, setTopics] = useState(DEFAULT_TOPICS.map(t => ({ ...t, מדריך: '', תאריך: '', בוצע: false, משתתפים: [] })));
  const [employees, setEmployees] = useState(DEFAULT_EMPLOYEES);
  const [newEmployee, setNewEmployee] = useState('');
  const [dialogTopic, setDialogTopic] = useState(null);
  const [tempSelected, setTempSelected] = useState([]);

  useEffect(() => {
    trainingSheet.fetchSheet();
    employeesSheet.fetchSheet();
  }, []);

  useEffect(() => {
    if (employeesSheet.data.length > 0) {
      setEmployees(employeesSheet.data.map(r => r['שם'] || Object.values(r)[0]).filter(Boolean));
    }
  }, [employeesSheet.data]);

  function updateTopic(i, field, val) {
    setTopics(prev => prev.map((t, idx) => idx === i ? { ...t, [field]: val } : t));
  }

  function openDialog(i) {
    setDialogTopic(i);
    setTempSelected([...topics[i].משתתפים]);
  }

  function toggleEmployee(name) {
    setTempSelected(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]);
  }

  function saveDialog() {
    updateTopic(dialogTopic, 'משתתפים', tempSelected);
    setDialogTopic(null);
  }

  function addEmployee() {
    const name = newEmployee.trim();
    if (name && !employees.includes(name)) {
      setEmployees(prev => [...prev, name]);
      setNewEmployee('');
    }
  }

  const exportCols = ['נושא', 'מסמכים', 'משתתפים', 'מדריך', 'תאריך', 'בוצע'];

  return (
    <div>
      <DocHeader tab="training" />

      {/* Employees panel */}
      <div className="border border-gray-200 rounded p-3 mb-4 bg-gray-50">
        <div className="font-semibold text-sm mb-2">רשימת עובדים</div>
        <div className="flex flex-wrap gap-2 mb-2">
          {employees.map(e => (
            <span key={e} className="bg-white border border-gray-300 rounded px-2 py-0.5 text-sm">{e}</span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={newEmployee}
            onChange={e => setNewEmployee(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addEmployee()}
            placeholder="הוסף עובד..."
            className="border border-gray-300 rounded px-3 py-1 text-sm focus:outline-none"
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
              <td className="border border-[#999] px-1 py-1">
                <input value={t.מדריך} onChange={e => updateTopic(i, 'מדריך', e.target.value)}
                  className="w-full bg-transparent px-2 py-0.5 focus:outline-none focus:bg-blue-50 rounded text-sm" />
              </td>
              <td className="border border-[#999] px-1 py-1">
                <input type="date" value={t.תאריך} onChange={e => updateTopic(i, 'תאריך', e.target.value)}
                  className="bg-transparent focus:outline-none focus:bg-blue-50 rounded text-sm" dir="ltr" />
              </td>
              <td className="border border-[#999] px-3 py-1.5 text-center">
                <input type="checkbox" checked={t.בוצע} onChange={e => updateTopic(i, 'בוצע', e.target.checked)}
                  className="w-4 h-4" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

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
