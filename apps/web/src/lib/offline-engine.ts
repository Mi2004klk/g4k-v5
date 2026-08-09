import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type EntityType = 
  | 'settings' 
  | 'tasks' 
  | 'documents' 
  | 'attendance' 
  | 'finance' 
  | 'hr' 
  | 'chat' 
  | 'comments';

export type QueueItemState = 'Pending' | 'Syncing' | 'Completed' | 'Failed' | 'Conflict' | 'Cancelled';

export type ConflictStrategy = 
  | 'LAST_WRITE_WINS' 
  | 'VERSION_MERGE' 
  | 'VERSION_MANUAL' 
  | 'SERVER_VALIDATION' 
  | 'SERVER_WINS' 
  | 'TIMESTAMP';

export type MutationRequest = {
  id: string;
  operation: string;
  entity: EntityType;
  version?: number;
  url: string;
  method: string;
  body: any;
  timestamp: number;
  retryCount: number;
  state: QueueItemState;
};

export const ENTITY_CONFLICT_STRATEGY: Record<EntityType, ConflictStrategy> = {
  settings: 'LAST_WRITE_WINS',
  tasks: 'VERSION_MERGE',
  documents: 'VERSION_MANUAL',
  attendance: 'SERVER_VALIDATION',
  finance: 'SERVER_WINS',
  hr: 'SERVER_WINS',
  chat: 'TIMESTAMP',
  comments: 'TIMESTAMP',
};

interface OfflineState {
  isOffline: boolean;
  mutationQueue: MutationRequest[];
  setOffline: (status: boolean) => void;
  queueMutation: (
    request: Omit<MutationRequest, 'id' | 'timestamp' | 'retryCount' | 'state'>
  ) => void;
  updateItemState: (id: string, state: QueueItemState) => void;
  removeMutation: (id: string) => void;
  clearQueue: () => void;
  resolveConflict: (id: string, resolution: 'client' | 'server' | any) => void;
}

export const useOfflineEngine = create<OfflineState>()(
  persist(
    (set) => ({
      isOffline: false,
      mutationQueue: [],
      setOffline: (status) => set({ isOffline: status }),
      queueMutation: (req) =>
        set((state) => ({
          mutationQueue: [
            ...state.mutationQueue,
            {
              ...req,
              id: crypto.randomUUID(),
              timestamp: Date.now(),
              retryCount: 0,
              state: 'Pending',
            },
          ],
        })),
      updateItemState: (id, newState) =>
        set((state) => ({
          mutationQueue: state.mutationQueue.map((item) =>
            item.id === id ? { ...item, state: newState } : item
          ),
        })),
      removeMutation: (id) =>
        set((state) => ({
          mutationQueue: state.mutationQueue.filter((m) => m.id !== id),
        })),
      clearQueue: () => set({ mutationQueue: [] }),
      resolveConflict: (id, resolution) =>
        set((state) => ({
          mutationQueue: state.mutationQueue.map((item) => {
            if (item.id !== id) return item;
            if (resolution === 'server') {
              return { ...item, state: 'Cancelled' };
            }
            return { ...item, body: resolution, state: 'Pending' };
          }),
        })),
    }),
    {
      name: 'g4k-offline-mutations-v2',
    }
  )
);
