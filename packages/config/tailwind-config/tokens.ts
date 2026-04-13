/**
 * FactoryOS design tokens — Amethyst Mint Harmony palette.
 *
 * Source palette:
 *   #562F54 — deep eggplant purple (primary brand)
 *   #8DF688 — mint green (accent)
 *   #2A3F38 — dark forest green
 *   #57585D — steel grey
 *   #F650BD — neon pink (highlight)
 */

export const colors = {
  // Brand — purple (eggplant) scale
  brand: {
    50: '#F8F1F7',
    100: '#EFE0ED',
    200: '#DDC0D9',
    300: '#C299BD',
    400: '#A3749E',
    500: '#80567D',
    600: '#562F54',   // main (from palette)
    700: '#472547',
    800: '#361B37',
    900: '#2A152A',
    950: '#1A0D1A',
  },
  // Accent — mint green scale
  accent: {
    50: '#F3FEF2',
    100: '#E1FCDE',
    200: '#C2F9BC',
    300: '#8DF688',   // main (from palette)
    400: '#5DE857',
    500: '#38CC32',
    600: '#2AA525',
    700: '#23851F',
    800: '#1E6A1B',
    900: '#1A5618',
  },
  // Highlight — neon pink (use sparingly for special CTAs)
  highlight: {
    50: '#FEF0F9',
    100: '#FDDBF1',
    200: '#FBB7E3',
    300: '#F88FD2',
    400: '#F650BD',   // main (from palette)
    500: '#D82EA0',
    600: '#A92179',
    700: '#7E1A5B',
  },
  // Semantic
  success: {
    50: '#f0fdf4',
    200: '#bbf7d0',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
  },
  warning: {
    50: '#fffbeb',
    200: '#fde68a',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },
  danger: {
    50: '#fef2f2',
    200: '#fecaca',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
  },
  // Neutrals — slightly warmed to harmonize with palette
  neutral: {
    0: '#ffffff',
    50: '#fafafa',
    100: '#f4f4f5',
    200: '#e4e4e7',
    300: '#d4d4d8',
    400: '#a1a1aa',
    500: '#71717a',
    600: '#52525b',
    700: '#3f3f46',
    800: '#27272a',
    900: '#18181b',
    950: '#09090b',
  },
} as const;

export const fontFamily = {
  sans: ['Inter', 'system-ui', 'sans-serif'],
  mono: ['JetBrains Mono', 'monospace'],
} as const;

export const spacing = {
  '4.5': '1.125rem',
  '13': '3.25rem',
  '15': '3.75rem',
  '18': '4.5rem',
} as const;

export const borderRadius = {
  none: '0',
  sm: '0.25rem',
  DEFAULT: '0.375rem',
  md: '0.5rem',
  lg: '0.75rem',
  xl: '1rem',
  '2xl': '1.5rem',
  full: '9999px',
} as const;
