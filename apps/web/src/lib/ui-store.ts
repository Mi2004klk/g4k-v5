import { create } from "zustand";
import { persist } from "zustand/middleware";
import { apiFetch } from "./api-client";

export type SidebarState = "expanded" | "collapsed" | "hidden";

interface UIState {
  sidebarState: SidebarState;
  isInitialized: boolean;
  setSidebarState: (state: SidebarState) => void;
  cycleSidebarState: () => void;
  initPreferences: () => Promise<void>;
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      sidebarState: "collapsed", // Default as per requirements
      isInitialized: false,

      setSidebarState: (state) => {
        set({ sidebarState: state });
        // Sync with backend asynchronously
        apiFetch("/auth/preferences", {
          method: "PUT",
          body: JSON.stringify({
            preferences: { sidebar_state: state },
          }),
        }).catch(() => {
          // Ignore sync errors gracefully
        });
      },

      cycleSidebarState: () => {
        const current = get().sidebarState;
        const nextState =
          current === "collapsed"
            ? "expanded"
            : current === "expanded"
            ? "hidden"
            : "collapsed";
        get().setSidebarState(nextState);
      },

      initPreferences: async () => {
        if (get().isInitialized) return;
        try {
          const res: any = await apiFetch("/auth/preferences");
          if (res.preferences?.sidebar_state) {
            set({ sidebarState: res.preferences.sidebar_state });
          }
        } catch (err) {
          // Fallback to persisted state
        } finally {
          set({ isInitialized: true });
        }
      },
    }),
    {
      name: "g4k-ui-storage",
      partialize: (state) => ({ sidebarState: state.sidebarState }),
    }
  )
);
