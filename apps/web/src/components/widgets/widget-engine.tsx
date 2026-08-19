"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { apiFetch } from "@/lib/api-client";
import { reconcileLayout, GRID_COLS } from "@/lib/reconcile-layout";
import { ErrorBoundary } from "@g4k/ui/components";
import { useUIStore } from "@/lib/ui-store";
import { useShallow } from "zustand/react/shallow";
import { useDashboardInit } from "@/hooks/use-dashboard-init";

import { Responsive as ResponsiveGridLayout, WidthProvider } from "react-grid-layout/legacy";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

const ResponsiveGridWithWidth = WidthProvider(ResponsiveGridLayout);
const GridLayout = dynamic(() => Promise.resolve({ default: ResponsiveGridWithWidth }), { ssr: false }) as React.ElementType;

interface WidgetEngineProps {
  availableWidgets: Array<{
    id: string;
    component: React.ReactNode;
    defaultLayout: Record<string, unknown> | { lg?: unknown; md?: unknown; sm?: unknown; xs?: unknown; xxs?: unknown };
  }>;
}

export function WidgetEngine({ availableWidgets }: WidgetEngineProps) {
  const [layouts, setLayouts] = useState<Record<string, unknown[]>>(() => ({
    lg: availableWidgets.map((w: any) => ({ ...(w.defaultLayout?.lg || w.defaultLayout), i: w.id })),
    md: availableWidgets.map((w: any) => ({ ...(w.defaultLayout?.md || w.defaultLayout), i: w.id })),
    sm: availableWidgets.map((w: any) => ({ ...(w.defaultLayout?.sm || w.defaultLayout), i: w.id })),
    xs: availableWidgets.map((w: any) => ({ ...(w.defaultLayout?.xs || w.defaultLayout), i: w.id })),
    xxs: availableWidgets.map((w: any) => ({ ...(w.defaultLayout?.xxs || w.defaultLayout), i: w.id })),
  }));
  const [, setMounted] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const { widgetStates, dismissWidget } = useUIStore(useShallow((s) => ({
    widgetStates: s.widgetStates,
    dismissWidget: s.dismissWidget,
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
      result[bp] = items.map((item: any) => {
        const isCollapsed = widgetStates[item.i]?.collapsed ?? false;
        if (isCollapsed) {
          return { ...item, h: 1, minH: 1, maxH: 1, isResizable: false };
        }
        // If uncollapsed, restore original height if currently stuck at h: 1
        const defaultWidget = Array.isArray(availableWidgets) ? availableWidgets.find((w) => w.id === item.i) : undefined;
        const normalHeight = (defaultWidget?.defaultLayout as any)?.h || (defaultWidget?.defaultLayout as any)?.lg?.h || 3;
        const currentH = item.h === 1 ? normalHeight : item.h;
        return { ...item, h: currentH, minH: 2, maxH: undefined, isResizable: true };
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
  }, [preferencesData, availableWidgets]);

  const handleLayoutChange = (_currentLayout: unknown, allLayouts: Record<string, unknown[]>) => {
    const isDifferent = JSON.stringify(layouts) !== JSON.stringify(allLayouts);
    if (!isDifferent) return; // Prevent unnecessary re-renders (Fix for #2)

    setLayouts((prev) => (JSON.stringify(prev) === JSON.stringify(allLayouts) ? prev : allLayouts));
    
    // Suppress persistence until (a) preferences loaded AND (b) user interacted
    if (!preferencesData || !isDirtyRef.current) return;

    if (layoutTimeoutRef.current) {
      clearTimeout(layoutTimeoutRef.current);
    }
    // Debounce layout save API call to prevent spamming on drag (UX-10)
    layoutTimeoutRef.current = setTimeout(async () => {
      try {
        await apiFetch("/auth/preferences", {
          method: "PUT",
          body: JSON.stringify({
            preferences: { 
              dashboard_layout: { version: 1, layouts: allLayouts } 
            },
          }),
        });
      } catch {
        // Ignore layout save errors silently
      }
    }, 500);
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
      <style>{`
        .is-dragging-widget a,
        .is-dragging-widget button,
        .is-dragging-widget [role="button"] {
          pointer-events: none !important;
        }
        .react-resizable-handle {
          opacity: 0;
          transition: opacity 0.2s;
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
        rowHeight={120}
        onLayoutChange={handleLayoutChange}
        onDragStart={handleDragStart}
        onDragStop={handleDragStop}
        onResizeStart={handleResizeStart}
        onResizeStop={handleDragStop}
        margin={[12, 12] as [number, number]}
        draggableHandle=".widget-drag-handle"
      >
        {availableWidgets.map((widget) => (
          <div key={widget.id} className="h-full group/widget relative">
            <div className="absolute top-2 right-2 opacity-0 group-hover/widget:opacity-100 transition-opacity z-50 flex items-center bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm px-1.5 py-1 rounded shadow-sm border border-neutral-200/50 dark:border-neutral-700/50">
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
    </div>
  );
}
