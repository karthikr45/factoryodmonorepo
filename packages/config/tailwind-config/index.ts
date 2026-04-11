/**
 * Shared Tailwind preset for FactoryOS.
 * apps/web (Tailwind) and apps/mobile (NativeWind) both use this preset.
 */
import type { Config } from 'tailwindcss';

import { borderRadius, colors, fontFamily, spacing } from './tokens';

const preset = {
  content: [],
  theme: {
    extend: {
      colors,
      fontFamily,
      spacing,
      borderRadius,
    },
  },
  plugins: [],
} satisfies Partial<Config>;

export default preset;
export { borderRadius, colors, fontFamily, spacing };
