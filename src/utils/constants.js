export const STATUS_THRESHOLDS = {
  tools: 60,
  machines: 60,
  suppliers: 90,
  filters: 90,
};

export const INACTIVE_VALUES = ['לא בשימוש', 'לא נדרש כיול', 'לא נדרש', 'לא נדרש פילטר', 'NA', '-', ''];

export const TAB_CHAPTERS = {
  dashboard: 'QA Module',
  tools: 'F-7.6.1 Control of monitoring and measurement equipment',
  machines: 'F-7.6.1-1 Machine Calibrating Log',
  filters: 'F-7.6.1-2 Filter Maintenance Log',
  lamps: 'Laser Lamps Log',
  suppliers: 'Approved Suppliers List',
  training: 'F-6.2-2 Annual Training Plan',
};

export const TAB_SUBJECTS = {
  dashboard: 'לוח בקרה',
  tools: 'כלי מדידה',
  machines: 'מערכות',
  filters: 'פילטרים',
  lamps: 'מנורות לייזר',
  suppliers: 'ספקים מאושרים',
  training: 'תוכנית הדרכה שנתית',
};

export const APP_VERSION = import.meta.env.VITE_APP_VERSION || '1.0.6';
export const APP_PASSWORD = import.meta.env.VITE_APP_PASSWORD || 'shoham2024';
