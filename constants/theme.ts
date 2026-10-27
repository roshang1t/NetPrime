import { TextStyle, useColorScheme } from "react-native";
import { Colors } from "./Colors";

// Single entry point for design tokens: import { useTheme, spacing, radius, type } from "@/constants/theme".
// Colors stay in Colors.ts (light/dark pairs); everything else lives here.

export { Colors };
export type ThemeColors = typeof Colors.dark;

/** Current palette; re-renders on light/dark changes. */
export function useTheme(): ThemeColors {
  return Colors[useColorScheme() === "light" ? "light" : "dark"];
}

// Fixed colors for things drawn on top of artwork or behind dialogs. They don't
// follow light/dark: text over a poster must stay white either way.
export const artwork = {
  text: "#FFFFFF",
  textMuted: "#FFFFFFB3",
  badge: "#000000A6", // play disc on posters and episode stills
  button: "#00000073", // round icon buttons over the hero
  scrimFrom: "#00000000",
  scrimTo: "#000000CC", // bottom fade on the Home billboard
  dialogScrim: "#000000B3",
} as const;

// 4-point grid. Screen edge padding is `lg`.
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radius = {
  sm: 6, // thumbnails, small badges
  md: 10, // posters
  lg: 14, // buttons, cards, inputs
  xl: 20, // sheets, dialogs
  full: 999, // pills, avatars
} as const;

// Poster sizes (2:3) shared by every row and grid
export const poster = {
  row: { width: 112, height: 168 },
  aspect: 1.5,
} as const;

// Type ramp. Colors are applied at render time (see ThemedText) so these stay static.
export const type = {
  display: { fontSize: 32, fontWeight: "800", letterSpacing: -0.6, lineHeight: 38 },
  title: { fontSize: 24, fontWeight: "700", letterSpacing: -0.4, lineHeight: 30 },
  section: { fontSize: 19, fontWeight: "700", letterSpacing: -0.2 },
  headline: { fontSize: 16, fontWeight: "600" },
  body: { fontSize: 15, fontWeight: "400", lineHeight: 22 },
  callout: { fontSize: 14, fontWeight: "500" },
  caption: { fontSize: 12, fontWeight: "500" },
  overline: { fontSize: 11, fontWeight: "700", letterSpacing: 1.2, textTransform: "uppercase" },
} as const satisfies Record<string, TextStyle>;

export type TypeVariant = keyof typeof type;
