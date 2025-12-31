// Utility hook for saving/loading Excel file in IndexedDB
import { useEffect } from 'react';

const DB_NAME = 'ExcelViewerDB';
const STORE_NAME = 'excelFiles';
const FILE_KEY = 'lastExcel';

export function saveExcelToDB(file) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = (event) => {
      const db = event.target.result;
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put(file, FILE_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = (e) => reject(e);
    };
    request.onerror = (e) => reject(e);
  });
}

export function loadExcelFromDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = (event) => {
      const db = event.target.result;
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const getReq = store.get(FILE_KEY);
      getReq.onsuccess = () => resolve(getReq.result);
      getReq.onerror = (e) => reject(e);
    };
    request.onerror = (e) => reject(e);
  });
}
