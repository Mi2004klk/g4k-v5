import { create } from "zustand";
import { persist } from "zustand/middleware";
import { apiFetch } from "./api-client";

export type SidebarState = "hidden" | "expanded" | "collapsed";

interface UIState {
  sidebarState: SidebarState;
  isInitialized: boolean;
  dismissedNotificationIds: number[];
  widgetStates: Record<string, { collapsed?: boolean }>;
  setSidebarState: (state: SidebarState) => void;
  cycleSidebarState: () => void;
  initPreferences: () => Promise<void>;
  dismissNotification: (id: number) => void;
  clearPopupNotifications: (ids: number[]) => void;
  toggleWidgetCollapse: (widgetId: string) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      sidebarState: "collapsed", // Default as per requirements
      isInitialized: false,
      dismissedNotificationIds: [],
      widgetStates: {},

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
        const nextState = current === "collapsed" || current === "hidden" ? "expanded" : "collapsed";
        get().setSidebarState(nextState);
      },

      dismissNotification: (id: number) => {
        set((state) => ({
          dismissedNotificationIds: [...state.dismissedNotificationIds, id],
        }));
      },

      clearPopupNotifications: (ids: number[]) => {
        set((state) => ({
          dismissedNotificationIds: Array.from(new Set([...state.dismissedNotificationIds, ...ids])),
        }));
      },

      toggleWidgetCollapse: (widgetId: string) => {
        set((state) => {
          const current = state.widgetStates[widgetId]?.collapsed ?? false;
          return {
            widgetStates: {
              ...state.widgetStates,
              [widgetId]: { ...state.widgetStates[widgetId], collapsed: !current },
            },
          };
        });
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
      partialize: (state) => ({
        sidebarState: state.sidebarState,
        dismissedNotificationIds: state.dismissedNotificationIds,
        widgetStates: state.widgetStates,
      }),
    }
  )
);
