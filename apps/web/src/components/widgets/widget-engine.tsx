"use client";

import { useEffect, useState } from "react";
import { ResponsiveGridLayout, useContainerWidth } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import { apiFetch } from "@/lib/api-client";
import { ErrorBoundary } from "@g4k/ui/components";
import { Skeleton } from "@g4k/ui/components";

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
  const { containerRef, width } = useContainerWidth();

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

  const handleLayoutChange = async (_currentLayout: any, allLayouts: any) => {
    setLayouts(allLayouts);
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
    <div ref={containerRef} className="w-full min-h-[500px]">
      {(width ?? 0) > 0 && (
        <ResponsiveGridLayout
          className="layout"
          width={width ?? 1200}
          layouts={layouts}
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
          cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
          rowHeight={120}
          onLayoutChange={handleLayoutChange}
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
