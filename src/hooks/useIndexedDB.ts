import { useEffect, useRef, useState } from "react";

const DB_NAME = "bIDE";
const STORE_NAME = "files";
const DB_VERSION = 1;
const WRITE_INTERVAL_MS = 350;

export interface StoredFile {
  id: string;
  name: string;
  content: string;
  language: string;
  type: 'file' | 'folder';
  lastModified?: number;
}

type PendingWrite = {
  file: StoredFile;
  timer: ReturnType<typeof setTimeout> | null;
  resolve: Array<() => void>;
  reject: Array<(reason?: unknown) => void>;
};

export const useIndexedDB = () => {
  const [db, setDb] = useState<IDBDatabase | null>(null);
  const pendingWrites = useRef<Map<string, PendingWrite>>(new Map());
  const lastWriteAt = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error("IndexedDB error:", request.error);
    };

    request.onsuccess = () => {
      setDb(request.result);
    };

    request.onupgradeneeded = (event) => {
      const nextDb = (event.target as IDBOpenDBRequest).result;
      if (!nextDb.objectStoreNames.contains(STORE_NAME)) {
        nextDb.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };

    return () => {
      try {
        request.result?.close();
      } catch {
        // The open request may not have completed yet.
      }
    };
  }, []);

  const persistFile = (database: IDBDatabase, file: StoredFile): Promise<void> => {
    return new Promise((resolve, reject) => {
      const transaction = database.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put({ ...file, lastModified: Date.now() });

      request.onsuccess = () => {
        lastWriteAt.current.set(file.id, Date.now());
        resolve();
      };
      request.onerror = () => {
        if (request.error?.name === 'QuotaExceededError') {
          try {
            sessionStorage.setItem(`file_${file.id}`, JSON.stringify(file));
          } catch {
            // If both stores are full, surface the same stable error below.
          }
          reject(new Error("STORAGE_FULL"));
        } else {
          reject(request.error);
        }
      };
    });
  };

  const flushPendingWrite = async (id: string): Promise<void> => {
    const pending = pendingWrites.current.get(id);
    if (!pending) return;

    pendingWrites.current.delete(id);
    if (pending.timer) clearTimeout(pending.timer);

    if (!db) {
      pending.resolve.forEach((resolve) => resolve());
      return;
    }

    try {
      await persistFile(db, pending.file);
      pending.resolve.forEach((resolve) => resolve());
    } catch (error) {
      pending.reject.forEach((reject) => reject(error));
    }
  };

  const saveFile = (file: StoredFile): Promise<void> => {
    if (!db) return Promise.resolve();

    const existing = pendingWrites.current.get(file.id);
    if (existing) {
      existing.file = file;
      return new Promise((resolve, reject) => {
        existing.resolve.push(resolve);
        existing.reject.push(reject);
      });
    }

    const elapsed = Date.now() - (lastWriteAt.current.get(file.id) || 0);
    if (elapsed >= WRITE_INTERVAL_MS) {
      return persistFile(db, file);
    }

    const wait = Math.max(0, WRITE_INTERVAL_MS - elapsed);
    return new Promise((resolve, reject) => {
      const pending: PendingWrite = {
        file,
        timer: null,
        resolve: [resolve],
        reject: [reject],
      };
      pending.timer = setTimeout(() => {
        void flushPendingWrite(file.id);
      }, wait);
      pendingWrites.current.set(file.id, pending);
    });
  };

  useEffect(() => {
    if (!db) return;

    const flushAll = () => {
      for (const id of Array.from(pendingWrites.current.keys())) {
        void flushPendingWrite(id);
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') flushAll();
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('pagehide', flushAll);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('pagehide', flushAll);
      flushAll();
    };
  }, [db]);

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

    const pending = pendingWrites.current.get(id);
    if (pending?.timer) clearTimeout(pending.timer);
    pendingWrites.current.delete(id);
    lastWriteAt.current.delete(id);

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

    for (const pending of pendingWrites.current.values()) {
      if (pending.timer) clearTimeout(pending.timer);
      pending.resolve.forEach((resolve) => resolve());
    }
    pendingWrites.current.clear();
    lastWriteAt.current.clear();

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
