import { describe, it, expect } from "vitest";
import { reconcileLayout } from "./reconcile-layout";

describe("reconcileLayout", () => {
  const colsMap = { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 };
  const availableWidgets = [
    { id: "w1", defaultLayout: { lg: { w: 3, h: 3, x: 0, y: 0 } } },
    { id: "w2", defaultLayout: { lg: { w: 4, h: 2, x: 3, y: 0 } } },
  ];

  it("should merge saved layout with missing default widgets", () => {
    const savedLayout = {
      lg: [{ i: "w1", w: 3, h: 3, x: 0, y: 0 }]
    };
    const result = reconcileLayout(savedLayout, availableWidgets, colsMap);
    expect(result?.lg).toHaveLength(2);
    expect(result?.lg.find((i: any) => i.i === "w2")).toBeTruthy();
  });

  it("should filter out unknown widgets from saved layout", () => {
    const savedLayout = {
      lg: [
        { i: "w1", w: 3, h: 3, x: 0, y: 0 },
        { i: "unknown_w", w: 3, h: 3, x: 5, y: 0 }
      ]
    };
    const result = reconcileLayout(savedLayout, availableWidgets, colsMap);
    expect(result?.lg).toHaveLength(2); // w1 and w2 (added from available)
    expect(result?.lg.find((i: any) => i.i === "unknown_w")).toBeFalsy();
  });

  it("should clamp coordinates and size to valid geometry", () => {
    const savedLayout = {
      lg: [{ i: "w1", w: 20, h: 0, x: -5, y: -2 }]
    };
    const result = reconcileLayout(savedLayout, availableWidgets, colsMap);
    const w1 = result?.lg.find((i: any) => i.i === "w1");
    expect(w1.w).toBe(12); // clamped to maxCols
    expect(w1.x).toBe(0); // clamped to >=0
    expect(w1.y).toBe(0); // clamped to >=0
    expect(w1.h).toBe(3); // repaired from 0
  });
});
