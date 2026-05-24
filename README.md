# QA Module — M. Shoham Trading LTD.

אפליקציית Web לניהול מודול איכות, המחליפה את ניהול הטפסים הידני ב-Word.

**גרסה:** 1.0.2 | **Live:** https://eyalbarmaimon.github.io/qa-module-shoham/

## Stack
- React + Vite + Tailwind CSS
- Firebase Firestore (DB)
- GitHub API — אחסון מסמכים סרוקים (repo: `qa-module-shoham`, נתיב: `Scanned_Doc/`)
- GitHub Pages + GitHub Actions (hosting & deploy)
- html2canvas + jsPDF (PDF export)

## אחסון מסמכים סרוקים (Scaned Doc)

קבצים (PDF / JPG) נשמרים ב-GitHub בתוך ה-repo הראשי של האפליקציה:

**https://github.com/eyalBarMaimon/qa-module-shoham**

מבנה התיקיות:
```
Scanned_Doc/
  └── {קטגוריה}/
        └── {שם_מכשיר}/
              └── YYYYMMDD_מספרסידורי.pdf
```

כתובת גישה ישירה לקובץ:
```
https://raw.githubusercontent.com/eyalBarMaimon/qa-module-shoham/main/Scanned_Doc/...
```

האחסון **חינמי לחלוטין** — GitHub משמש כ-CDN ציבורי.

## מודולים
| מודול | תיאור |
|-------|--------|
| Dashboard | 6 כרטיסי סיכום + טבלת התראות — לחיצה על שם מכשיר פותחת את הדיאלוג שלו ישירות |
| כלי מדידה (F-7.6.1) | 53 פריטים, כיול, היסטוריה, עריכת פרטים |
| מערכות (F-7.6.1-1) | 13 מכונות לייזר, כיול, עריכת פרטים |
| פילטרים (F-7.6.1-2) | 14 פילטרים, תחזוקה רבעונית |
| מנורות | יומן החלפת מנורות לייזר |
| ספקים | 32 ספקים, ISO cert expiry |
| הדרכות (F-6.2-2) | תכנית הדרכות שנתית |

## שינויים אחרונים — v1.0.2
- ניווט חכם מלוח בקרה: לחיצה על שם פריט בטבלת ההתראות מנווטת ללשונית ופותחת את חלון העדכן/היסטוריה אוטומטית
- EditToolDialog / EditMachineDialog — עריכת פרטי מכשיר/מכונה
- FileDropZone — גרירת קבצי כיול (PDF/JPG)
- אחסון מסמכים סרוקים ב-GitHub API

## פיתוח מקומי
```bash
npm install
npm run dev
```

> מסמך מפרט מלא: `../QA_MODULE_SPEC.md`
