"use client";

import { useEffect, useState } from "react";
import GridLayout from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

const ResponsiveGridLayout = (GridLayout as any).WidthProvider((GridLayout as any).Responsive);

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

  // Load layout preferences from backend
  useEffect(() => {
    const fetchPreferences = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      try {
        const res = await fetch(process.env.NEXT_PUBLIC_API_URL + "/auth/preferences", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.preferences?.dashboard_layout) {
            setLayouts(data.preferences.dashboard_layout);
          } else {
            // Generate default layout
            setLayouts({ lg: availableWidgets.map(w => w.defaultLayout) });
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
        setMounted(true);
      }
    };
    fetchPreferences();
  }, [availableWidgets]);

  const handleLayoutChange = async (_currentLayout: any, allLayouts: any) => {
    setLayouts(allLayouts);
    
    // Persist to backend (debouncing omitted for brevity in M1)
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      await fetch(process.env.NEXT_PUBLIC_API_URL + "/auth/preferences", {
        method: "PUT",
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          preferences: { dashboard_layout: allLayouts }
        })
      });
    } catch (e) {
      console.error("Failed to save layout", e);
    }
  };

  if (loading || !mounted) return <div className="p-4 text-zinc-400">Loading widgets...</div>;

  return (
    <div className="w-full min-h-[500px]">
      <ResponsiveGridLayout
        className="layout"
        layouts={layouts}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
        rowHeight={100}
        onLayoutChange={handleLayoutChange}
        draggableHandle=".cursor-move"
        margin={[16, 16]}
      >
        {availableWidgets.map((widget) => (
          <div key={widget.id}>
            {widget.component}
          </div>
        ))}
      </ResponsiveGridLayout>
    </div>
  );
}
