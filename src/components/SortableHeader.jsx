export default function SortableHeader({ col, label, sort, onSort, className = '' }) {
  const active = sort.col === col;
  const arrow = active ? (sort.dir === 'asc' ? ' ↑' : ' ↓') : '';
  return (
    <th
      onClick={() => onSort(col)}
      className={`border border-[#999] px-3 py-2 font-bold cursor-pointer select-none hover:bg-[#C9C9C9] whitespace-nowrap ${active ? 'bg-[#C5D9F1]' : ''} ${className}`}
    >
      {label}{arrow}
    </th>
  );
}
