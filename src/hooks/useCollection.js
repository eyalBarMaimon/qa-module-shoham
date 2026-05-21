import { useState, useCallback } from 'react';
import {
  collection, getDocs, addDoc, updateDoc, deleteDoc, doc, setDoc
} from 'firebase/firestore';
import { db } from '../firebase';

export function useCollection(collectionName) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchSheet = useCallback(async () => {
    if (!import.meta.env.VITE_FIREBASE_PROJECT_ID) {
      setError('חסרים פרטי חיבור ל-Firebase');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const snap = await getDocs(collection(db, collectionName));
      const rows = snap.docs.map(d => ({ _id: d.id, ...d.data() }));
      setData(rows);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [collectionName]);

  const updateRow = useCallback(async (docId, rowData) => {
    const { _id, ...fields } = rowData;
    await updateDoc(doc(db, collectionName, docId), fields);
  }, [collectionName]);

  const appendRow = useCallback(async (rowData) => {
    const { _id, ...fields } = rowData;
    const ref = await addDoc(collection(db, collectionName), fields);
    return ref.id;
  }, [collectionName]);

  const deleteRow = useCallback(async (docId) => {
    await deleteDoc(doc(db, collectionName, docId));
  }, [collectionName]);

  return { data, loading, error, fetchSheet, updateRow, appendRow, deleteRow, setData };
}
