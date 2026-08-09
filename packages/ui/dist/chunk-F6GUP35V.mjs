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

export {
  colors,
  accentPalette,
  chartColors,
  echartsTheme,
  themePreset
};
