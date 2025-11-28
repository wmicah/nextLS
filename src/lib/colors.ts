// Centralized color system for NextLevel Coaching
// Updated design system with golden yellow accents

export const COLORS = {
  // Golden Yellow Accent System
  GOLDEN_ACCENT: "#E5B232",
  GOLDEN_HOVER: "#F5C242",
  GOLDEN_DARK: "#B1872E",
  GOLDEN_BORDER: "#3D2C10",

  // Alert Colors
  RED_ALERT: "#D9534F",
  RED_DARK: "#A63A37",
  RED_BORDER: "#772C2A",

  // Success Colors
  GREEN_PRIMARY: "#70CF70", // Reduced opacity for softer appearance
  GREEN_DARK: "#3E8E41",

  // Communication/Broadcast Colors
  BLUE_PRIMARY: "#4A90E2",
  BLUE_DARK: "#357ABD",

  // Background Colors
  BACKGROUND_DARK: "#15191a",
  BACKGROUND_CARD: "rgba(255, 255, 255, 0.02)",
  BACKGROUND_CARD_HOVER: "rgba(255, 255, 255, 0.04)",

  // Border Colors
  BORDER_SUBTLE: "rgba(255, 255, 255, 0.1)",
  BORDER_ACCENT: "rgba(229, 178, 50, 0.2)",

  // Text Colors
  TEXT_PRIMARY: "#F5F5F5",
  TEXT_SECONDARY: "#B3B8C2",
  TEXT_MUTED: "#606364",
} as const;

// Helper functions for opacity variations
export const getGoldenAccent = (opacity: number = 1) => {
  const r = 229;
  const g = 178;
  const b = 50;
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

export const getRedAlert = (opacity: number = 1) => {
  const r = 217;
  const g = 83;
  const b = 79;
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

export const getGreenPrimary = (opacity: number = 1) => {
  const r = 109;
  const g = 196;
  const b = 109;
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

export const getBluePrimary = (opacity: number = 1) => {
  const r = 74;
  const g = 144;
  const b = 226;
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};
