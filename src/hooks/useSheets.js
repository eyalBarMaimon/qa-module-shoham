import { useState, useCallback } from 'react';

const API_KEY = import.meta.env.VITE_SHEETS_API_KEY;
const SPREADSHEET_ID = import.meta.env.VITE_SPREADSHEET_ID;
const BASE = 'https://sheets.googleapis.com/v4/spreadsheets';

function rowsToObjects(rows) {
  if (!rows || rows.length < 2) return [];
  const headers = rows[0];
  return rows.slice(1).map((row, i) => {
    const obj = { _rowIndex: i + 2 };
    headers.forEach((h, j) => { obj[h] = row[j] ?? ''; });
    return obj;
  });
}

function objectsToRows(objects, headers) {
  return objects.map(obj => headers.map(h => obj[h] ?? ''));
}

export function useSheets(sheetName) {
  const [data, setData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchSheet = useCallback(async () => {
    if (!API_KEY || !SPREADSHEET_ID) {
      setError('חסרים פרטי חיבור ל-Google Sheets');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const url = `${BASE}/${SPREADSHEET_ID}/values/${encodeURIComponent(sheetName)}?key=${API_KEY}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const rows = json.values || [];
      if (rows.length > 0) setHeaders(rows[0]);
      setData(rowsToObjects(rows));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [sheetName]);

  const updateRow = useCallback(async (rowIndex, rowData) => {
    const values = [headers.map(h => rowData[h] ?? '')];
    const range = `${sheetName}!A${rowIndex}`;
    const url = `${BASE}/${SPREADSHEET_ID}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED&key=${API_KEY}`;
    await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ values }),
    });
  }, [sheetName, headers]);

  const appendRow = useCallback(async (rowData) => {
    const values = [headers.map(h => rowData[h] ?? '')];
    const url = `${BASE}/${SPREADSHEET_ID}/values/${encodeURIComponent(sheetName)}:append?valueInputOption=USER_ENTERED&key=${API_KEY}`;
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ values }),
    });
  }, [sheetName, headers]);

  const deleteRow = useCallback(async (rowIndex) => {
    // Clear the row content (Sheets API delete requires batchUpdate with sheetId)
    const range = `${sheetName}!A${rowIndex}:Z${rowIndex}`;
    const url = `${BASE}/${SPREADSHEET_ID}/values/${encodeURIComponent(range)}:clear?key=${API_KEY}`;
    await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' } });
  }, [sheetName]);

  return { data, headers, loading, error, fetchSheet, updateRow, appendRow, deleteRow, setData };
}
