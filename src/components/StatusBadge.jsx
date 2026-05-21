const STYLES = {
  red:   'bg-[#FECDD3] text-[#991B1B] border border-[#FCA5A5]',
  amber: 'bg-[#FEF3C7] text-[#92400E] border border-[#FCD34D]',
  green: 'bg-[#D1FAE5] text-[#065F46] border border-[#6EE7B7]',
  gray:  'bg-[#F3F4F6] text-[#6B7280] border border-[#D1D5DB]',
};

const LABELS = {
  red:   'פג תוקף',
  amber: 'בקרוב',
  green: 'תקין',
  gray:  'לא פעיל',
};

export default function StatusBadge({ status }) {
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${STYLES[status] || STYLES.gray}`}>
      {LABELS[status] || status}
    </span>
  );
}
