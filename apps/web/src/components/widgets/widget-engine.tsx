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
        if (data.preferences?.dashboard_layout) {
          setLayouts(data.preferences.dashboard_layout);
        } else {
          setLayouts({ lg: availableWidgets.map((w) => w.defaultLayout) });
        }
      } catch {
        setLayouts({ lg: availableWidgets.map((w) => w.defaultLayout) });
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
