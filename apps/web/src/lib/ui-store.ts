import { create } from "zustand";
import { persist } from "zustand/middleware";
import { apiFetch } from "./api-client";

export type SidebarState = "hidden" | "expanded" | "collapsed";

interface UIState {
  sidebarState: SidebarState;
  isInitialized: boolean;
  dismissedNotificationIds: number[];
  dismissedWidgets: string[];
  widgetStates: Record<string, { collapsed?: boolean, previousHeight?: number }>;
  setSidebarState: (state: SidebarState) => void;
  setSidebarStateSilent: (state: SidebarState) => void;
  cycleSidebarState: () => void;
  dismissNotification: (id: number) => void;
  clearPopupNotifications: (ids: number[]) => void;
  toggleWidgetCollapse: (widgetId: string, currentHeight?: number) => void;
  dismissWidget: (widgetId: string) => void;
  toggleWidgetVisibility: (widgetId: string) => void;
  restoreWidgets: () => void;
  hydrateFromServer: (dismissed: string[], states: Record<string, { collapsed?: boolean, previousHeight?: number }>) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      sidebarState: "collapsed", // Default as per requirements
      isInitialized: false,
      dismissedNotificationIds: [],
      dismissedWidgets: [] as string[],
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
          dismissedNotificationIds: [...state.dismissedNotificationIds, id].slice(-100),
        }));
      },

      clearPopupNotifications: (ids: number[]) => {
        set((state) => ({
          dismissedNotificationIds: Array.from(new Set([...state.dismissedNotificationIds, ...ids])).slice(-100),
        }));
      },

      toggleWidgetCollapse: (widgetId: string, currentHeight?: number) => {
        set((state) => {
          const current = state.widgetStates[widgetId]?.collapsed ?? false;
          return {
            widgetStates: {
              ...state.widgetStates,
              [widgetId]: { 
                ...state.widgetStates[widgetId], 
                collapsed: !current,
                previousHeight: currentHeight !== undefined ? currentHeight : state.widgetStates[widgetId]?.previousHeight
              },
            },
          };
        });
      },

      dismissWidget: (widgetId: string) => {
        set((state) => ({
          dismissedWidgets: Array.from(new Set([...state.dismissedWidgets, widgetId])),
        }));
      },

      toggleWidgetVisibility: (widgetId: string) => {
        set((state) => {
          const isDismissed = state.dismissedWidgets.includes(widgetId);
          if (isDismissed) {
            return { dismissedWidgets: state.dismissedWidgets.filter(id => id !== widgetId) };
          } else {
            return { dismissedWidgets: [...state.dismissedWidgets, widgetId] };
          }
        });
      },

      restoreWidgets: () => {
        set({ dismissedWidgets: [] });
      },

      hydrateFromServer: (dismissed, states) => {
        set({
          dismissedWidgets: Array.isArray(dismissed) ? dismissed : [],
          widgetStates: states && typeof states === 'object' ? states : {}
        });
      },

    }),
    {
      name: "g4k-ui-storage",
      skipHydration: true,
      partialize: (state) => ({
        sidebarState: state.sidebarState,
        dismissedNotificationIds: state.dismissedNotificationIds,
        dismissedWidgets: state.dismissedWidgets,
        widgetStates: state.widgetStates,
      }),
    }
  )
);
