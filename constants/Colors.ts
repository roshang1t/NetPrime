/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 *
 * Minimal, artwork-first palette: near-monochrome surfaces, one accent for the
 * primary action, gold only for ratings. Always 6-digit hex so callers can
 * append an alpha suffix (e.g. `color.icon + "33"`).
 */

export const Colors = {
  light: {
    text: '#0A0A0A',
    textSecondary: '#6E6E73',
    textTertiary: '#A1A1A6',
    background: '#FFFFFF',
    surface: '#F2F2F7',
    surfaceRaised: '#E5E5EA',
    separator: '#E5E5EA',
    accent: '#0A0A0A',
    onAccent: '#FFFFFF',
    star: '#E8A800',
    danger: '#FF3B30',
    overlay: '#000000',
    // Legacy names used across older screens; mapped onto the tokens above
    tint: '#0A0A0A',
    icon: '#6E6E73',
    tabIconDefault: '#A1A1A6',
    tabIconSelected: '#0A0A0A',
  },
  dark: {
    text: '#F5F5F7',
    textSecondary: '#A1A1A6',
    textTertiary: '#6E6E73',
    background: '#000000',
    surface: '#141414',
    surfaceRaised: '#1F1F1F',
    separator: '#262626',
    accent: '#F5F5F7',
    onAccent: '#000000',
    star: '#F5C518',
    danger: '#FF453A',
    overlay: '#000000',
    tint: '#F5F5F7',
    icon: '#A1A1A6',
    tabIconDefault: '#6E6E73',
    tabIconSelected: '#F5F5F7',
  },
};
