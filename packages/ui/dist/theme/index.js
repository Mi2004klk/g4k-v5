"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/theme/index.ts
var theme_exports = {};
__export(theme_exports, {
  accentPalette: () => accentPalette,
  chartColors: () => chartColors,
  colors: () => colors,
  echartsTheme: () => echartsTheme,
  themePreset: () => themePreset
});
module.exports = __toCommonJS(theme_exports);

// src/theme/tokens.ts
var colors = {
  primary: "#1A1A2E",
  success: "#16A34A",
  info: "#2563EB",
  warning: "#D97706",
  danger: "#DC2626",
  neutralStatus: "#6B7280",
  overtime: "#D97706",
  successDark: "#22C55E",
  infoDark: "#3B82F6",
  warningDark: "#F59E0B",
  dangerDark: "#EF4444",
  neutralStatusDark: "#9CA3AF",
  overtimeDark: "#F59E0B"
};
var accentPalette = {
  violet: "#8A2BE2",
  violetDeep: "#9400D3",
  gold: "#FFD700",
  pink: "#FF1493",
  orange: "#F97316",
  coral: "#FF7F50",
  red: "#EF4444",
  magenta: "#D946EF",
  blue: "#3B82F6",
  indigo: "#6366F1",
  cyan: "#06B6D4",
  teal: "#14B8A6",
  green: "#22C55E",
  lime: "#84CC16",
  gray: "#6B7280"
};
var chartColors = [
  accentPalette.violet,
  accentPalette.blue,
  accentPalette.cyan,
  accentPalette.teal,
  accentPalette.green,
  accentPalette.lime,
  "#EAB308",
  // yellow
  "#F59E0B",
  // amber
  accentPalette.orange,
  accentPalette.red,
  accentPalette.pink,
  accentPalette.magenta
];
var echartsTheme = {
  color: chartColors,
  backgroundColor: "transparent",
  textStyle: {
    fontFamily: '"Inter", ui-sans-serif, system-ui, sans-serif'
  }
  // We can expand this with more ECharts specific tokens later
};
var themePreset = {
  colors: {
    primary: {
      DEFAULT: colors.primary
    },
    accent: accentPalette
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  accentPalette,
  chartColors,
  colors,
  echartsTheme,
  themePreset
});
