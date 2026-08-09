import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { apiFetch } from './api-client';

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
}

class OfflineEngine {
  private dbPromise: Promise<IDBPDatabase<AttendanceDB>> | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.dbPromise = openDB<AttendanceDB>('g4k-offline-attendance', 1, {
        upgrade(db) {
          const store = db.createObjectStore('punches', {
            keyPath: 'client_id',
          });
          store.createIndex('by-status', 'syncStatus');
        },
      });

      window.addEventListener('online', () => this.syncPendingPunches());
    }
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

    // Try to sync immediately
    if (navigator.onLine) {
      this.syncPendingPunches();
    }

    return client_id;
  }

  async syncPendingPunches() {
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
        });

        punch.syncStatus = 'synced';
        await db.put('punches', punch);
      } catch (err: any) {
        if (err.status && err.status >= 400 && err.status < 500) {
          // If it's a client error (e.g. 422 state machine violation), mark as failed so it doesn't keep retrying
          punch.syncStatus = 'failed';
          await db.put('punches', punch);
        }
        // If it's a network error or 500, we leave it pending for the next retry
      }
    }
  }
}

export const offlineEngine = new OfflineEngine();
