"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ResponsiveGridLayout, useContainerWidth } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import { apiFetch } from "@/lib/api-client";
import { ErrorBoundary } from "@g4k/ui/components";
import { Skeleton } from "@g4k/ui/components";
import { useUIStore } from "@/lib/ui-store";

interface WidgetEngineProps {
  availableWidgets: Array<{
    id: string;
    component: React.ReactNode;
    defaultLayout: any;
  }>;
}

export function WidgetEngine({ availableWidgets }: WidgetEngineProps) {
  const [layouts, setLayouts] = useState<any>({});
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const { widgetStates } = useUIStore();
  
  const draggingRef = useRef(false);
  const startPosRef = useRef({ x: 0, y: 0 });
  const layoutTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const dragStopTimerRef = useRef<NodeJS.Timeout | null>(null);
  const { containerRef, width } = useContainerWidth();

  // Dynamically recalculate heights when widgets collapse/expand (UX-11)
  const computedLayouts = useMemo(() => {
    if (!layouts || Object.keys(layouts).length === 0) return layouts;
    const result: any = {};
    Object.keys(layouts).forEach((bp) => {
      const items = layouts[bp] || [];
      result[bp] = items.map((item: any) => {
        const isCollapsed = widgetStates[item.i]?.collapsed ?? false;
        if (isCollapsed) {
          return { ...item, h: 1, minH: 1, maxH: 1 };
        }
        // If uncollapsed, restore original height if currently stuck at h: 1
        const defaultWidget = availableWidgets.find((w) => w.id === item.i);
        const normalHeight = defaultWidget?.defaultLayout?.h || 3;
        const currentH = item.h === 1 ? normalHeight : item.h;
        return { ...item, h: currentH, minH: undefined, maxH: undefined };
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
    const fetchPreferences = async () => {
      try {
        const data = await apiFetch("/auth/preferences");
        if (data.preferences?.dashboard_layout && Object.keys(data.preferences.dashboard_layout).length > 0) {
          const savedLayouts = data.preferences.dashboard_layout;
          const mergedBreakpoints: any = {};
          const breakpoints = ['lg', 'md', 'sm', 'xs', 'xxs'];
          
          breakpoints.forEach(bp => {
            const savedBp = Array.isArray(savedLayouts[bp]) ? savedLayouts[bp] : [];
            const mergedBp = [...savedBp];
            
            // Append missing widgets
            availableWidgets.forEach(w => {
              const exists = mergedBp.find((item: any) => item.i === w.id);
              if (!exists) {
                mergedBp.push({ ...w.defaultLayout, i: w.id });
              }
            });
            
            // Filter out old/removed widgets
            mergedBreakpoints[bp] = mergedBp.filter((item: any) => availableWidgets.find(w => w.id === item.i));
          });
          
          setLayouts(mergedBreakpoints);
        } else {
          const defaultBreakpoints = {
            lg: availableWidgets.map((w) => ({ ...w.defaultLayout, i: w.id })),
            md: availableWidgets.map((w) => ({ ...w.defaultLayout, i: w.id })),
            sm: availableWidgets.map((w) => ({ ...w.defaultLayout, i: w.id })),
            xs: availableWidgets.map((w) => ({ ...w.defaultLayout, i: w.id })),
            xxs: availableWidgets.map((w) => ({ ...w.defaultLayout, i: w.id })),
          };
          setLayouts(defaultBreakpoints);
        }
      } catch {
        const defaultBreakpoints = {
          lg: availableWidgets.map((w) => ({ ...w.defaultLayout, i: w.id })),
          md: availableWidgets.map((w) => ({ ...w.defaultLayout, i: w.id })),
          sm: availableWidgets.map((w) => ({ ...w.defaultLayout, i: w.id })),
          xs: availableWidgets.map((w) => ({ ...w.defaultLayout, i: w.id })),
          xxs: availableWidgets.map((w) => ({ ...w.defaultLayout, i: w.id })),
        };
        setLayouts(defaultBreakpoints);
      } finally {
        setLoading(false);
        setMounted(true);
      }
    };
    fetchPreferences();
  }, [availableWidgets]);

  const handleLayoutChange = (_currentLayout: any, allLayouts: any) => {
    setLayouts(allLayouts);
    if (layoutTimeoutRef.current) {
      clearTimeout(layoutTimeoutRef.current);
    }
    // Debounce layout save API call to prevent spamming on drag (UX-10)
    layoutTimeoutRef.current = setTimeout(async () => {
      try {
        await apiFetch("/auth/preferences", {
          method: "PUT",
          body: JSON.stringify({
            preferences: { dashboard_layout: allLayouts },
          }),
        });
      } catch {
        // Ignore layout save errors silently
      }
    }, 1000);
  };

  const handleDragStart = () => {
    if (dragStopTimerRef.current) clearTimeout(dragStopTimerRef.current);
    draggingRef.current = true;
    setIsDragging(true);
  };

  const handleDragStop = () => {
    dragStopTimerRef.current = setTimeout(() => {
      draggingRef.current = false;
      setIsDragging(false);
    }, 150);
  };

  if (loading || !mounted) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`w-full min-h-[500px] ${isDragging ? "is-dragging-widget" : ""}`}>
      <style>{`
        .is-dragging-widget a,
        .is-dragging-widget button,
        .is-dragging-widget [role="button"] {
          pointer-events: none !important;
        }
      `}</style>
      {(width ?? 0) > 0 && (
        <ResponsiveGridLayout
          className="layout"
          width={width ?? 1200}
          layouts={computedLayouts}
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
          cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
          rowHeight={120}
          onLayoutChange={handleLayoutChange}
          onDragStart={handleDragStart}
          onDragStop={handleDragStop}
          margin={[16, 16] as [number, number]}
        >
          {availableWidgets.map((widget) => (
            <div key={widget.id} className="h-full">
              <ErrorBoundary name={`Widget-${widget.id}`}>
                {widget.component}
              </ErrorBoundary>
            </div>
          ))}
        </ResponsiveGridLayout>
      )}
    </div>
  );
}
