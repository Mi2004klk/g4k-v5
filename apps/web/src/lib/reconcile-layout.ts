export const GRID_COLS = { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 };

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- grid layout items are dynamic
export function reconcileLayout(savedLayouts: any, availableWidgets: Array<any>, colsMap: { [key: string]: number }) {
  if (!savedLayouts || Object.keys(savedLayouts).length === 0) return null;
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mergedBreakpoints: Record<string, any[]> = {};
  const breakpoints = ['lg', 'md', 'sm', 'xs', 'xxs'];
  
  breakpoints.forEach(bp => {
    const savedBp = Array.isArray(savedLayouts[bp]) ? savedLayouts[bp] : [];
    const mergedBp: any[] = [];
    const seen = new Set();
    
    savedBp.forEach((item: any) => {
      if (!seen.has(item.i)) {
        seen.add(item.i);
        mergedBp.push(item);
      }
    });
    
    if (Array.isArray(availableWidgets)) {
      availableWidgets.forEach(w => {
        const exists = mergedBp.find((item: any) => item.i === w.id);
        if (!exists) {
          mergedBp.push({ ...(w.defaultLayout?.[bp] || w.defaultLayout), i: w.id });
        }
      });
    }
    
    // Filter out old/removed widgets and clamp/repair geometry
    const maxCols = colsMap[bp as keyof typeof colsMap] || 12;
    mergedBreakpoints[bp] = mergedBp
      .filter((item: any) => Array.isArray(availableWidgets) ? availableWidgets.find(w => w.id === item.i) : false)
      .map((item: any) => {
         const defaultWidget = availableWidgets.find(w => w.id === item.i);
         const defL = defaultWidget?.defaultLayout?.[bp] || defaultWidget?.defaultLayout;
         
         let { x, y, w, h } = item;
         
         // Repair missing or invalid
         if (typeof x !== 'number' || isNaN(x)) x = defL?.x || 0;
         if (typeof y !== 'number' || isNaN(y)) y = defL?.y || 0;
         if (typeof w !== 'number' || isNaN(w) || w <= 0) w = defL?.w || 3;
         if (typeof h !== 'number' || isNaN(h) || h <= 0) h = defL?.h || 3;
         
         // Clamp width and x position
         w = Math.min(w, maxCols);
         x = Math.min(x, maxCols - w);
         x = Math.max(0, x);
         y = Math.max(0, y);
         
         return { ...item, x, y, w, h };
      });
  });
  
  return mergedBreakpoints;
}
