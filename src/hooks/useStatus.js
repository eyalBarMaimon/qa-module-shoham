import { INACTIVE_VALUES, STATUS_THRESHOLDS } from '../utils/constants';
import { daysUntil } from '../utils/dateUtils';

export function calcStatus(nextDateStr, type = 'tools') {
  if (!nextDateStr) return 'gray';
  const val = String(nextDateStr).trim();
  if (INACTIVE_VALUES.includes(val)) return 'gray';

  const days = daysUntil(val);
  if (days === null) return 'gray';

  const threshold = STATUS_THRESHOLDS[type] ?? 60;
  if (days < 0) return 'red';
  if (days <= threshold) return 'amber';
  return 'green';
}

export function calcFilterStatus(lastDateStr, frequency) {
  if (!frequency || INACTIVE_VALUES.includes(String(frequency).trim())) return 'gray';
  if (!lastDateStr) return 'amber';
  const days = daysUntil(lastDateStr);
  if (days === null) return 'gray';
  // amber if more than 90 days ago (days since last = negative daysUntil)
  if (days < -90) return 'amber';
  return 'green';
}
