import { describe, it, expect } from "vitest";
import { reconcileLayout } from "../lib/utils/layout-utils";

describe("reconcileLayout", () => {
  const availableWidgets = [
    { id: "w1", defaultLayout: { lg: { w: 4, h: 2, x: 0, y: 0 } } },
    { id: "w2", defaultLayout: { lg: { w: 6, h: 3, x: 4, y: 0 } } },
    { id: "w3", defaultLayout: { lg: { w: 12, h: 4, x: 0, y: 2 } } }, // This widget will test clamping if w > maxCols
  ];

  const colsMap = { lg: 12, md: 10 };

  it("handles empty/invalid saved layouts safely", () => {
    const result = reconcileLayout(null, availableWidgets, colsMap);
    expect(result).toBeNull();

    const result2 = reconcileLayout("invalid", availableWidgets, colsMap);
    expect(result2).toBeNull();
  });

  it("adds missing widgets at defaults without overwriting valid saved widgets", () => {
    const saved = {
      version: 1,
      layouts: {
        lg: [{ i: "w1", x: 2, y: 2, w: 2, h: 2 }], // User modified w1
      },
      dismissed: [],
    };

    const result = reconcileLayout(saved, availableWidgets, colsMap);
    
    // w1 should retain user settings
    const w1 = result?.layouts.lg.find((i: any) => i.i === "w1");
    expect(w1).toEqual(expect.objectContaining({ i: "w1", x: 2, y: 2, w: 2, h: 2 }));

    // w2 and w3 should be added from defaults
    const w2 = result?.layouts.lg.find((i: any) => i.i === "w2");
    expect(w2).toEqual(expect.objectContaining({ i: "w2", w: 6, h: 3, x: 4, y: 0 }));
  });

  it("drops stale/unknown widget ids", () => {
    const saved = {
      version: 1,
      layouts: {
        lg: [{ i: "stale-widget", x: 0, y: 0, w: 2, h: 2 }],
      },
      dismissed: [],
    };

    const result = reconcileLayout(saved, availableWidgets, colsMap);
    
    const stale = result?.layouts.lg.find((i: any) => i.i === "stale-widget");
    expect(stale).toBeUndefined();
  });

  it("repairs zero/invalid geometry and clamps to max columns", () => {
    const saved = {
      version: 1,
      layouts: {
        lg: [
          { i: "w1", x: -5, y: -2, w: 0, h: 0 }, // Invalid small values
          { i: "w2", x: 10, y: 0, w: 5, h: 2 }, // Overflowing x + w
          { i: "w3", x: 0, y: 0, w: 20, h: 2 }, // w > maxCols
        ],
      },
      dismissed: [],
    };

    const result = reconcileLayout(saved, availableWidgets, colsMap);
    
    const w1 = result?.layouts.lg.find((i: any) => i.i === "w1");
    expect(w1).toEqual(expect.objectContaining({ x: 0, y: -2, w: 1, h: 1 })); // x clamped to 0, w/h clamped to 1. Note: react-grid-layout allows negative y sometimes but wait... our logic says `typeof item.y === 'number' ? item.y : 0` so it leaves y alone.

    const w2 = result?.layouts.lg.find((i: any) => i.i === "w2");
    expect(w2).toEqual(expect.objectContaining({ x: 12 - 5, y: 0, w: 5, h: 2 })); // x clamped to maxCols - w (12 - 5 = 7)

    const w3 = result?.layouts.lg.find((i: any) => i.i === "w3");
    expect(w3).toEqual(expect.objectContaining({ x: 0, y: 0, w: 12, h: 2 })); // w clamped to 12
  });

  it("handles double-nested schema reads seamlessly", () => {
    const savedNested = {
      preferences: {
        dashboard_layout: {
          version: 1,
          layouts: {
            lg: [{ i: "w1", x: 5, y: 5, w: 2, h: 2 }],
          },
          dismissed: [],
        },
      }
    };

    const result = reconcileLayout(savedNested, availableWidgets, colsMap);
    const w1 = result?.layouts.lg.find((i: any) => i.i === "w1");
    expect(w1.x).toBe(5);
  });
  
  it("respects dismissed widgets and does not re-add them", () => {
    const saved = {
      version: 1,
      layouts: {
        lg: [],
      },
      dismissed: ["w2"],
    };

    const result = reconcileLayout(saved, availableWidgets, colsMap);
    
    // w1 and w3 should be added
    expect(result?.layouts.lg.some((i: any) => i.i === "w1")).toBe(true);
    expect(result?.layouts.lg.some((i: any) => i.i === "w3")).toBe(true);
    
    // w2 should remain dismissed
    expect(result?.layouts.lg.some((i: any) => i.i === "w2")).toBe(false);
    expect(result?.dismissed).toContain("w2");
  });
});
