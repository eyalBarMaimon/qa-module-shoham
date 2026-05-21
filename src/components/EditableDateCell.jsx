import { useState } from 'react';
import { parseDate } from '../utils/dateUtils';

function toInputVal(str) {
  if (!str) return '';
  const d = parseDate(str);
  if (!d) return '';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function fromInputVal(str) {
  if (!str) return '';
  const [y, m, d] = str.split('-');
  return `${d}/${m}/${y}`;
}

export default function EditableDateCell({ value, onSave }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState('');

  function startEdit() {
    setDraft(toInputVal(value));
    setEditing(true);
  }

  function commit() {
    setEditing(false);
    const newVal = fromInputVal(draft);
    if (newVal && newVal !== value) onSave(newVal);
  }

  if (editing) {
    return (
      <input
        type="date"
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }}
        className="bg-blue-50 border border-blue-300 rounded px-1 py-0.5 text-sm"
        dir="ltr"
        autoFocus
      />
    );
  }

  return (
    <span
      onClick={startEdit}
      className="cursor-pointer rounded px-1 py-0.5 group inline-flex items-center gap-1 hover:bg-blue-50"
      title="לחץ לעדכון תאריך"
    >
      {value || <span className="text-gray-300">—</span>}
      <span className="text-blue-300 text-xs opacity-0 group-hover:opacity-100">✏</span>
    </span>
  );
}
