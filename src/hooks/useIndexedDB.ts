import { useEffect, useState } from "react";

const DB_NAME = "OpenIDE";
const STORE_NAME = "files";
const DB_VERSION = 1;

export interface StoredFile {
  id: string;
  name: string;
  content: string;
  language: string;
  type: 'file' | 'folder';
  lastModified?: number;
}

export const useIndexedDB = () => {
  const [db, setDb] = useState<IDBDatabase | null>(null);

  useEffect(() => {
    const openDB = () => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error("IndexedDB error:", request.error);
      };

      request.onsuccess = () => {
        setDb(request.result);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: "id" });
        }
      };
    };

    openDB();
  }, []);

  const saveFile = async (file: StoredFile): Promise<void> => {
    if (!db) return;

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put({ ...file, lastModified: Date.now() });

      request.onsuccess = () => resolve();
      request.onerror = () => {
        // Handle quota exceeded errors on iOS
        if (request.error?.name === 'QuotaExceededError') {
          // Try to save to sessionStorage as fallback
          try {
            sessionStorage.setItem(`file_${file.id}`, JSON.stringify(file));
            reject(new Error("STORAGE_FULL"));
          } catch {
            reject(new Error("STORAGE_FULL"));
          }
        } else {
          reject(request.error);
        }
      };
    });
  };

  const loadFiles = async (): Promise<StoredFile[]> => {
    if (!db) return [];

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  };

  const deleteFile = async (id: string): Promise<void> => {
    if (!db) return;

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  };

  const clearAll = async (): Promise<void> => {
    if (!db) return;

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  };

  return { saveFile, loadFiles, deleteFile, clearAll, isReady: !!db };
};
