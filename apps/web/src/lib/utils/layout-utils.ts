import { asArray } from "@/lib/api-client";
export function reconcileLayout(saved: any, availableWidgets: any[], colsMap: Record<string, number>) {
  if (!saved || typeof saved !== "object") return null;

  let layoutData = saved;
  if (saved.preferences?.dashboard_layout) {
    layoutData = saved.preferences.dashboard_layout;
  }

  if (!layoutData.layouts) return null;

  const result = {
    version: layoutData.version || 1,
    layouts: {} as Record<string, any[]>,
    dismissed: asArray(layoutData.dismissed),
  };

  const widgetMap = new Map();
  availableWidgets.forEach(w => widgetMap.set(w.id, w));

  Object.keys(colsMap).forEach(bp => {
    const maxCols = colsMap[bp];
    const bpLayouts = Array.isArray(layoutData.layouts[bp]) ? layoutData.layouts[bp] : [];
    
    // Filter and sanitize existing
    const sanitized = bpLayouts
      .filter((item: any) => item && typeof item.i === "string" && widgetMap.has(item.i))
      .map((item: any) => {
        let { i, x, y, w, h } = item;
        
        x = typeof x === 'number' && !isNaN(x) ? Math.max(0, x) : 0;
        y = typeof y === 'number' && !isNaN(y) ? y : 0; 
        w = typeof w === 'number' && !isNaN(w) && w > 0 ? w : 1;
        h = typeof h === 'number' && !isNaN(h) && h > 0 ? h : 1;

        if (w > maxCols) w = maxCols;
        if (x + w > maxCols) x = Math.max(0, maxCols - w);

        return { ...item, i, x, y, w, h };
      });

    const presentIds = new Set(sanitized.map((item: any) => item.i));
    const dismissedIds = new Set(result.dismissed);

    // Add missing from defaults
    availableWidgets.forEach(w => {
      if (!presentIds.has(w.id) && !dismissedIds.has(w.id)) {
        const bpDefault = w.defaultLayout?.[bp] || w.defaultLayout;
        if (bpDefault) {
          let { x = 0, y = 0, w: defW = 1, h: defH = 1 } = bpDefault;
          if (defW > maxCols) defW = maxCols;
          if (x + defW > maxCols) x = Math.max(0, maxCols - defW);
          
          sanitized.push({ ...bpDefault, i: w.id, x, y, w: defW, h: defH });
        }
      }
    });

    result.layouts[bp] = sanitized;
  });

  return result;
}
