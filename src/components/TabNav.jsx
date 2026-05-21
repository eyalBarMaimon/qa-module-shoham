const TABS = [
  { id: 'dashboard', label: 'לוח בקרה' },
  { id: 'tools',     label: 'כלי מדידה' },
  { id: 'machines',  label: 'מערכות' },
  { id: 'filters',   label: 'פילטרים' },
  { id: 'lamps',     label: 'מנורות' },
  { id: 'suppliers', label: 'ספקים' },
  { id: 'training',  label: 'הדרכות' },
];

export default function TabNav({ active, onChange }) {
  return (
    <div className="flex flex-wrap gap-1 mb-4 border-b border-gray-300 pb-1">
      {TABS.map(t => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={`px-4 py-2 text-sm rounded-t font-medium transition-colors ${
            active === t.id
              ? 'bg-white border border-b-white border-gray-300 text-blue-700 -mb-px'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
