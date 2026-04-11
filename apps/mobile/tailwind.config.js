const sharedPreset = require('@repo/tailwind-config').default;

/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [sharedPreset],
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  plugins: [],
};
