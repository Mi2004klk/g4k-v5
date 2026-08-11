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
  setSidebarStateSilent: (state: SidebarState) => void;
  cycleSidebarState: () => void;
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

      setSidebarStateSilent: (state) => {
        set({ sidebarState: state });
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
