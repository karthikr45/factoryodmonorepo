/**
 * FactoryOS design tokens.
 * Shared between web (Tailwind) and mobile (NativeWind).
 */

export const colors = {
  // Brand — trustworthy navy for CA/finance, with warm industrial accent
  brand: {
    50: '#f0f4fa',
    100: '#dce5f2',
    200: '#b9cce5',
    300: '#8aa9d0',
    400: '#5a81b7',
    500: '#3a5f99',
    600: '#2c497a',
    700: '#243a61',
    800: '#1d2e4e',
    900: '#162540',
    950: '#0d1628',
  },
  // Accent — warm saffron for CTAs, reflecting Indian identity
  accent: {
    50: '#fff8eb',
    100: '#ffeac6',
    200: '#ffd488',
    300: '#ffb84a',
    400: '#ff9a1f',
    500: '#f57906',
    600: '#d85a02',
    700: '#b34207',
    800: '#91340d',
    900: '#772c0e',
  },
  // Semantic
  success: {
    50: '#f0fdf4',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
  },
  warning: {
    50: '#fffbeb',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
  },
  danger: {
    50: '#fef2f2',
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
  // Custom spacings beyond Tailwind defaults
  '4.5': '1.125rem',
  '13': '3.25rem',
  '15': '3.75rem',
  '18': '4.5rem',
} as const;

export const borderRadius = {
  // Keeps CA portal feeling professional, not startup-y
  none: '0',
  sm: '0.25rem',
  DEFAULT: '0.375rem',
  md: '0.5rem',
  lg: '0.75rem',
  xl: '1rem',
  '2xl': '1.5rem',
  full: '9999px',
} as const;
