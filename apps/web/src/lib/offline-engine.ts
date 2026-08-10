import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { apiFetch } from './api-client';
import toast from 'react-hot-toast';
import { create } from 'zustand';

// Store for observing queue length
export const useOfflineStore = create<{ queueCount: number; setQueueCount: (n: number) => void }>((set) => ({
  queueCount: 0,
  setQueueCount: (n) => set({ queueCount: n }),
}));

export interface GenericRequest {
  id: string;
  endpoint: string;
  options: {
    method: string;
    headers?: Record<string, string>;
    body?: string;
  };
  syncStatus: 'pending' | 'synced' | 'failed' | 'conflict';
  addedAt: number;
  retryCount: number;
  lastRetry?: number;
}

interface AttendanceDB extends DBSchema {
  punches: {
    value: {
      client_id: string;
      type: string;
      timestamp: string;
      syncStatus: 'pending' | 'synced' | 'failed';
    };
    key: string;
    indexes: { 'by-status': string };
  };
  requests: {
    value: GenericRequest;
    key: string;
    indexes: { 'by-status': string };
  }
}

class OfflineEngine {
  private dbPromise: Promise<IDBPDatabase<AttendanceDB>> | null = null;
  private syncing = false;
  // Retry ladder: 1s, 5s, 30s, 2m
  private retryLadder = [1000, 5000, 30000, 120000];

  constructor() {
    if (typeof window !== 'undefined') {
      this.dbPromise = openDB<AttendanceDB>('g4k-offline-attendance', 2, {
        upgrade(db, oldVersion, newVersion, transaction) {
          if (oldVersion < 1) {
            const store = db.createObjectStore('punches', { keyPath: 'client_id' });
            store.createIndex('by-status', 'syncStatus');
          }
          if (oldVersion < 2) {
            const reqStore = db.createObjectStore('requests', { keyPath: 'id' });
            reqStore.createIndex('by-status', 'syncStatus');
          }
        },
      });

      window.addEventListener('online', () => this.syncAll());
      
      // Update queue count initially and periodically
      this.dbPromise.then(() => {
        this.updateQueueCount();
        setInterval(() => this.updateQueueCount(), 5000);
      });
    }
  }

  private async updateQueueCount() {
    if (!this.dbPromise) return;
    const db = await this.dbPromise;
    const punches = await db.getAllFromIndex('punches', 'by-status', 'pending');
    const requests = await db.getAllFromIndex('requests', 'by-status', 'pending');
    useOfflineStore.getState().setQueueCount(punches.length + requests.length);
  }

  async recordPunch(type: string, timestamp: string): Promise<string> {
    if (!this.dbPromise) return "no-db";

    const client_id = `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const db = await this.dbPromise;

    await db.put('punches', {
      client_id,
      type,
      timestamp,
      syncStatus: 'pending',
    });

    this.updateQueueCount();

    if (navigator.onLine) {
      this.syncAll();
    }

    return client_id;
  }

  async queueRequest(endpoint: string, options: RequestInit): Promise<string> {
    if (!this.dbPromise) throw new Error("No DB");
    
    // Extract serializable options
    const serializableOptions: GenericRequest['options'] = {
      method: options.method || 'GET',
    };

    if (options.headers) {
      const h: Record<string, string> = {};
      new Headers(options.headers).forEach((value, key) => { h[key] = value; });
      serializableOptions.headers = h;
    }

    if (options.body && typeof options.body === 'string') {
      serializableOptions.body = options.body;
    }

    const db = await this.dbPromise;
    const id = `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    
    await db.put('requests', {
      id,
      endpoint,
      options: serializableOptions,
      syncStatus: 'pending',
      addedAt: Date.now(),
      retryCount: 0,
    });

    this.updateQueueCount();
    
    if (navigator.onLine) {
      this.syncAll();
    }

    return id;
  }

  async syncAll() {
    if (this.syncing || !this.dbPromise) return;
    this.syncing = true;
    try {
      await this.syncPendingPunches();
      await this.syncPendingRequests();
    } finally {
      this.syncing = false;
      this.updateQueueCount();
    }
  }

  private async syncPendingPunches() {
    if (!this.dbPromise) return;
    const db = await this.dbPromise;
    const pending = await db.getAllFromIndex('punches', 'by-status', 'pending');

    for (const punch of pending) {
      try {
        const endpoint = `/attendance/${punch.type.replace('_', '-')}`;
        await apiFetch(endpoint, {
          method: 'POST',
          body: JSON.stringify({
            client_id: punch.client_id,
            timestamp: punch.timestamp,
          }),
        }, true); // pass true to bypass offline queue loop

        punch.syncStatus = 'synced';
        await db.put('punches', punch);
      } catch (err: any) {
        if (err.status && err.status >= 400 && err.status < 500) {
          punch.syncStatus = 'failed';
          await db.put('punches', punch);
        }
      }
    }
  }

  private async syncPendingRequests() {
    if (!this.dbPromise) return;
    const db = await this.dbPromise;
    const pending = await db.getAllFromIndex('requests', 'by-status', 'pending');

    for (const req of pending) {
      // Check retry ladder
      const delay = this.retryLadder[Math.min(req.retryCount, this.retryLadder.length - 1)];
      if (req.lastRetry && Date.now() - req.lastRetry < delay) {
        continue; // Wait for backoff
      }

      req.lastRetry = Date.now();
      await db.put('requests', req);

      try {
        await apiFetch(req.endpoint, req.options, true);
        req.syncStatus = 'synced';
        await db.put('requests', req);
      } catch (err: any) {
        req.retryCount++;
        
        if (err.status === 409 || err.status === 422) {
          req.syncStatus = 'conflict';
          toast.error(`Conflict syncing request to ${req.endpoint}. Please review changes.`);
        } else if (err.status && err.status >= 400 && err.status < 500) {
          req.syncStatus = 'failed';
        }
        await db.put('requests', req);
      }
    }
  }
}

export const offlineEngine = new OfflineEngine();
