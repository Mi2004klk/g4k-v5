"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { apiFetch } from "@/lib/api-client";
import { reconcileLayout, GRID_COLS } from "@/lib/reconcile-layout";
import { ErrorBoundary, Button, DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, AppIcon } from "@g4k/ui/components";
import { useQueryClient } from "@tanstack/react-query";
import { useUIStore } from "@/lib/ui-store";
import { useShallow } from "zustand/react/shallow";
import { useDashboardInit } from "@/hooks/use-dashboard-init";

import { Responsive as ResponsiveGridLayout, WidthProvider } from "react-grid-layout/legacy";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

const ResponsiveGridWithWidth = WidthProvider(ResponsiveGridLayout);
const GridLayout = dynamic(() => Promise.resolve({ default: ResponsiveGridWithWidth }), { ssr: false }) as React.ElementType;

interface WidgetEngineProps {
  headerContent?: React.ReactNode;
  availableWidgets: Array<{
    id: string;
    component: React.ReactNode;
    defaultLayout: Record<string, unknown> | { lg?: unknown; md?: unknown; sm?: unknown; xs?: unknown; xxs?: unknown };
  }>;
}

export function WidgetEngine({ headerContent, availableWidgets }: WidgetEngineProps) {
  const queryClient = useQueryClient();
  const [layouts, setLayouts] = useState<Record<string, unknown[]>>(() => ({
    lg: availableWidgets.map((w: any) => ({ ...(w.defaultLayout?.lg || w.defaultLayout), i: w.id })),
    md: availableWidgets.map((w: any) => ({ ...(w.defaultLayout?.md || w.defaultLayout), i: w.id })),
    sm: availableWidgets.map((w: any) => ({ ...(w.defaultLayout?.sm || w.defaultLayout), i: w.id })),
    xs: availableWidgets.map((w: any) => ({ ...(w.defaultLayout?.xs || w.defaultLayout), i: w.id })),
    xxs: availableWidgets.map((w: any) => ({ ...(w.defaultLayout?.xxs || w.defaultLayout), i: w.id })),
  }));
  const [, setMounted] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const { widgetStates, dismissedWidgets, dismissWidget, toggleWidgetVisibility, restoreWidgets, hydrateFromServer } = useUIStore(useShallow((s) => ({
    widgetStates: s.widgetStates,
    dismissedWidgets: s.dismissedWidgets,
    dismissWidget: s.dismissWidget,
    toggleWidgetVisibility: s.toggleWidgetVisibility,
    restoreWidgets: s.restoreWidgets,
    hydrateFromServer: s.hydrateFromServer,
  })));
  
  const draggingRef = useRef(false);
  const startPosRef = useRef({ x: 0, y: 0 });
  const layoutTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const dragStopTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isDirtyRef = useRef(false);

  const { data: preferencesData } = useDashboardInit({
    select: (data: { preferences?: unknown }) => data?.preferences ?? null,
    staleTime: 60_000,
  });

  // Dynamically recalculate heights when widgets collapse/expand (UX-11)
  const computedLayouts = useMemo(() => {
    if (!layouts || Object.keys(layouts).length === 0) return layouts;
    const result: Record<string, unknown[]> = {};
    Object.keys(layouts).forEach((bp) => {
      const items = layouts[bp] || [];
      result[bp] = (Array.isArray(items) ? items : []).map((item: any) => {
        const isCollapsed = widgetStates[item.i]?.collapsed ?? false;
        if (isCollapsed) {
          return { ...item, h: 1, minH: 1, maxH: 1, isResizable: false };
        }
        // If uncollapsed, restore original height if currently stuck at h: 1
        const defaultWidget = Array.isArray(availableWidgets) ? availableWidgets.find((w) => w.id === item.i) : undefined;
        const normalHeight = widgetStates[item.i]?.previousHeight || (defaultWidget?.defaultLayout as any)?.h || (defaultWidget?.defaultLayout as any)?.lg?.h || 6;
        const currentH = item.h === 1 ? normalHeight : item.h;
        return { ...item, h: currentH, minH: 3, maxH: undefined, isResizable: true };
      });
    });
    return result;
  }, [layouts, widgetStates, availableWidgets]);

  // Prevent accidental clicks on widget content during/immediately after dragging with distance threshold (UX-9)
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      startPosRef.current = { x: e.clientX, y: e.clientY };
    };

    const captureClick = (e: MouseEvent) => {
      const dx = Math.abs(e.clientX - startPosRef.current.x);
      const dy = Math.abs(e.clientY - startPosRef.current.y);
      const moved = dx > 5 || dy > 5;

      if (draggingRef.current || moved) {
        e.stopPropagation();
        e.preventDefault();
      }
    };

    document.addEventListener("mousedown", handleMouseDown, true);
    document.addEventListener("click", captureClick, true);
    return () => {
      document.removeEventListener("mousedown", handleMouseDown, true);
      document.removeEventListener("click", captureClick, true);
    };
  }, []);

  const isHydratedRef = useRef(false);

  useEffect(() => {
    setMounted(true);
    if (!preferencesData) return;

    // T-33.3: Canonical read path + Schema versioning
    const savedLayoutsRaw = (preferencesData as any).dashboard_layout || (preferencesData as any).preferences?.dashboard_layout;
    
    // Migrator for unversioned layouts
    let savedLayouts = null;
    if (savedLayoutsRaw) {
      if (savedLayoutsRaw.version === 1 && savedLayoutsRaw.layouts) {
        savedLayouts = savedLayoutsRaw.layouts;
      } else if (!savedLayoutsRaw.version) {
        // Legacy unversioned
        savedLayouts = savedLayoutsRaw;
      }
    }

    const mergedBreakpoints = reconcileLayout(savedLayouts, availableWidgets as any[], GRID_COLS);

    if (mergedBreakpoints) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLayouts((prev) => JSON.stringify(prev) === JSON.stringify(mergedBreakpoints) ? prev : mergedBreakpoints);
    }
    
    // Hydrate visibility and collapse states from backend ONCE
    if (!isHydratedRef.current) {
      const dismissedRaw = (preferencesData as any).dismissed_widgets || (preferencesData as any).preferences?.dismissed_widgets;
      const statesRaw = (preferencesData as any).widget_states || (preferencesData as any).preferences?.widget_states;
      if (dismissedRaw || statesRaw) {
        hydrateFromServer(dismissedRaw || [], statesRaw || {});
      }
      isHydratedRef.current = true;
    }
  }, [preferencesData, availableWidgets, hydrateFromServer]);

  const savePreferences = (allLayouts: Record<string, unknown[]>, dismissed: string[], states: Record<string, any>, force = false) => {
    if (!preferencesData || (!isDirtyRef.current && !force)) return;

    if (layoutTimeoutRef.current) {
      clearTimeout(layoutTimeoutRef.current);
    }
    
    layoutTimeoutRef.current = setTimeout(async () => {
      try {
        await apiFetch("/auth/preferences", {
          method: "PUT",
          body: JSON.stringify({
            preferences: { 
              dashboard_layout: { version: 1, layouts: allLayouts },
              dismissed_widgets: dismissed,
              widget_states: states,
            },
          }),
        });
        import("@/lib/query-keys").then(({ queryKeys }) => {
          queryClient.invalidateQueries({ queryKey: queryKeys.dashboardInit });
        });
      } catch {
        // Ignore layout save errors silently
      }
    }, 500);
  };

  // Sync when visibility or collapse states change (but only if user interacted)
  useEffect(() => {
    if (isDirtyRef.current) {
      savePreferences(layouts, dismissedWidgets, widgetStates);
    }
  }, [dismissedWidgets, widgetStates]);

  const handleLayoutChange = (_currentLayout: unknown, allLayouts: Record<string, unknown[]>) => {
    // Restore the 'h' for any collapsed widget before saving so we don't overwrite its custom height
    const modifiedLayouts = { ...allLayouts };
    Object.keys(modifiedLayouts).forEach((bp) => {
      modifiedLayouts[bp] = (Array.isArray(modifiedLayouts[bp]) ? modifiedLayouts[bp] : []).map((item: any) => {
        const isCollapsed = widgetStates[item.i]?.collapsed ?? false;
        if (isCollapsed) {
          const orig = layouts[bp]?.find((o: any) => o.i === item.i) as any;
          if (orig) {
            return { ...item, h: orig.h };
          }
        }
        return item;
      });
    });

    const isDifferent = JSON.stringify(layouts) !== JSON.stringify(modifiedLayouts);
    if (!isDifferent) return; // Prevent unnecessary re-renders (Fix for #2)

    isDirtyRef.current = true;
    setLayouts((prev) => (JSON.stringify(prev) === JSON.stringify(modifiedLayouts) ? prev : modifiedLayouts));
    savePreferences(modifiedLayouts, dismissedWidgets, widgetStates);
  };

  const handleResetLayout = async () => {
    const defaultLayouts = {
      lg: availableWidgets.map((w: any) => ({ ...(w.defaultLayout?.lg || w.defaultLayout), i: w.id })),
      md: availableWidgets.map((w: any) => ({ ...(w.defaultLayout?.md || w.defaultLayout), i: w.id })),
      sm: availableWidgets.map((w: any) => ({ ...(w.defaultLayout?.sm || w.defaultLayout), i: w.id })),
      xs: availableWidgets.map((w: any) => ({ ...(w.defaultLayout?.xs || w.defaultLayout), i: w.id })),
      xxs: availableWidgets.map((w: any) => ({ ...(w.defaultLayout?.xxs || w.defaultLayout), i: w.id })),
    };
    setLayouts(defaultLayouts);
    hydrateFromServer([], {});
    
    isDirtyRef.current = false; // Prevent auto-save from overriding
    try {
      await apiFetch("/auth/preferences", {
        method: "PUT",
        body: JSON.stringify({
          preferences: { 
            dashboard_layout: null,
            dismissed_widgets: [],
            widget_states: {},
          },
        }),
      });
      import("@/lib/query-keys").then(({ queryKeys }) => {
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboardInit });
      });
    } catch {
      // Ignore
    }
  };

  const handleDragStart = () => {
    if (dragStopTimerRef.current) clearTimeout(dragStopTimerRef.current);
    draggingRef.current = true;
    setIsDragging(true);
    isDirtyRef.current = true;
  };

  const handleDragStop = () => {
    dragStopTimerRef.current = setTimeout(() => {
      draggingRef.current = false;
      setIsDragging(false);
    }, 150);
  };

  const handleResizeStart = () => {
    if (dragStopTimerRef.current) clearTimeout(dragStopTimerRef.current);
    draggingRef.current = true;
    setIsDragging(true);
    isDirtyRef.current = true;
  };

  const handleSaveLayout = () => {
    savePreferences(layouts, dismissedWidgets, widgetStates, true);
    isDirtyRef.current = false;
    import("sonner").then(({ toast }) => toast.success("Dashboard layout saved"));
  };

  return (
    <div 
      className={`w-full min-h-[500px] ${isDragging ? "is-dragging-widget" : ""}`}
      onClickCapture={(e) => {
        if (draggingRef.current) {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-2 mb-6">
        <div className="flex-1">
          {headerContent}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button 
          variant="outline" 
          size="sm" 
          className="h-8 text-neutral-600 hover:text-neutral-900"
          onClick={() => queryClient.invalidateQueries()}
        >
          <AppIcon name="refresh" className="mr-2 h-4 w-4" /> Refresh Dashboard
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8">
              <AppIcon name="settings" className="mr-2 h-4 w-4" /> Customize Dashboard
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-2 py-1.5 text-xs font-semibold text-neutral-500">Visible Widgets</div>
            {availableWidgets.map((w) => (
              <DropdownMenuItem 
                key={w.id} 
                onSelect={(e) => {
                  e.preventDefault();
                  toggleWidgetVisibility(w.id);
                  isDirtyRef.current = true;
                }}
                className="flex items-center justify-between"
              >
                <span>{w.id.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                {!dismissedWidgets.includes(w.id) && <AppIcon name="check" className="h-4 w-4 text-primary" />}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={handleSaveLayout} className="text-primary-600 focus:text-primary-700 font-semibold">
              <AppIcon name="check" className="mr-2 h-4 w-4" /> Save Layout
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={handleResetLayout} className="text-rose-600 focus:text-rose-700">
              <AppIcon name="refresh" className="mr-2 h-4 w-4" /> Reset to Default
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        </div>
      </div>

      <style>{`
        .is-dragging-widget a,
        .is-dragging-widget button,
        .is-dragging-widget [role="button"] {
          pointer-events: none !important;
        }
        .react-grid-item {
          overflow: hidden !important;
          border-radius: var(--radius);
        }
        .react-resizable-handle {
          opacity: 0;
          transition: opacity 0.2s;
          background-image: none !important;
          bottom: 2px !important;
          right: 2px !important;
          width: 20px !important;
          height: 20px !important;
          cursor: se-resize;
        }
        .react-resizable-handle::after {
          content: "";
          position: absolute;
          right: 4px;
          bottom: 4px;
          width: 8px;
          height: 8px;
          border-right: 2px solid #cbd5e1;
          border-bottom: 2px solid #cbd5e1;
          border-radius: 1px;
        }
        .dark .react-resizable-handle::after {
          border-color: #475569;
        }
        .react-grid-item:hover .react-resizable-handle {
          opacity: 1;
        }
      `}</style>
      <GridLayout
        className="layout"
        layouts={computedLayouts}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={GRID_COLS}
        rowHeight={40}
        onLayoutChange={handleLayoutChange}
        onDragStart={handleDragStart}
        onDragStop={handleDragStop}
        onResizeStart={handleResizeStart}
        onResizeStop={handleDragStop}
        margin={[12, 12] as [number, number]}
        draggableHandle=".widget-drag-handle"
      >
        {availableWidgets.filter(w => !dismissedWidgets.includes(w.id)).map((widget) => (
          <div key={widget.id} className="h-full group/widget relative flex flex-col [&>div:not(.absolute)]:flex-1 [&>div:not(.absolute)]:min-h-0 [&>div:not(.absolute)>*]:h-full">
            <div className="absolute top-2 right-2 opacity-0 group-hover/widget:opacity-100 transition-opacity z-50 flex items-center bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm px-1.5 py-1 rounded border border-neutral-200/50 dark:border-neutral-700/50">
              <div className="widget-drag-handle cursor-grab active:cursor-grabbing p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors" title="Drag to move">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="9" cy="12" r="1.5" />
                  <circle cx="9" cy="5" r="1.5" />
                  <circle cx="9" cy="19" r="1.5" />
                  <circle cx="15" cy="12" r="1.5" />
                  <circle cx="15" cy="5" r="1.5" />
                  <circle cx="15" cy="19" r="1.5" />
                </svg>
              </div>
            </div>
            <ErrorBoundary name={`Widget-${widget.id}`}>
              {widget.component}
            </ErrorBoundary>
          </div>
        ))}
      </GridLayout>

      {availableWidgets.filter(w => !dismissedWidgets.includes(w.id)).length === 0 && (
        <div className="flex flex-col items-center justify-center min-h-[40vh] text-center border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl bg-neutral-50/50 dark:bg-neutral-900/50 mx-2 mt-4 px-4">
          <div className="w-16 h-16 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-4">
            <AppIcon name="dashboard" size="xl" className="text-neutral-400" />
          </div>
          <h3 className="text-xl font-bold text-neutral-800 dark:text-neutral-200">Your dashboard is empty</h3>
          <p className="text-sm text-neutral-500 max-w-sm mt-2 mb-6">
            You've cleared all your widgets. Add some back to keep track of your tasks, attendance, and team activities.
          </p>
          <Button onClick={restoreWidgets} variant="primary" className="shadow-e1">
            <AppIcon name="plus" className="mr-2" /> Add Widgets
          </Button>
        </div>
      )}
    </div>
  );
}
