/**
 * FactoryOS design tokens — Neptune palette.
 * Shared between web (Tailwind) and mobile (NativeWind).
 *
 * Source palette:
 *   #8FD9FB — sky blue
 *   #4AB5B5 — teal
 *   #6D8BC0 — slate blue
 *   #525AFF — vivid indigo (primary)
 */

export const colors = {
  // Brand — cool, modern indigo/slate palette
  brand: {
    50: '#F3F6FC',
    100: '#E5EBF8',
    200: '#D0DAF0',
    300: '#B0C2E0',
    400: '#8CA5D0',
    500: '#6D8BC0',   // slate blue (from palette)
    600: '#525AFF',   // vivid indigo (from palette)
    700: '#3844D0',
    800: '#2C3499',
    900: '#1A1F5C',
    950: '#0A0D33',
  },
  // Accent — cool teal + sky
  accent: {
    50: '#F0FBFF',
    100: '#D8EFFE',
    200: '#B8E5FD',
    300: '#8FD9FB',   // sky blue (from palette)
    400: '#6FCACA',
    500: '#4AB5B5',   // teal (from palette)
    600: '#3A9999',
    700: '#2F7878',
    800: '#245959',
    900: '#193F3F',
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
  // Neutrals
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
