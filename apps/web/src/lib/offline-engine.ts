import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type PendingLogin = {
  identifier: string;
  passwordHash: string; // Storing plain text password is bad, maybe just cue state
  timestamp: number;
};

interface OfflineState {
  isOffline: boolean;
  pendingLogin: PendingLogin | null;
  setOffline: (status: boolean) => void;
  queueLogin: (identifier: string, pass: string) => void;
  clearQueue: () => void;
}

export const useOfflineEngine = create<OfflineState>()(
  persist(
    (set) => ({
      isOffline: false, // will be synced with navigator.onLine on mount
      pendingLogin: null,
      setOffline: (status) => set({ isOffline: status }),
      queueLogin: (identifier, passwordHash) => 
        set({ pendingLogin: { identifier, passwordHash, timestamp: Date.now() } }),
      clearQueue: () => set({ pendingLogin: null }),
    }),
    {
      name: 'g4k-offline-storage',
    }
  )
);
