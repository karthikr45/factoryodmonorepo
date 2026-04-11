module.exports = {
  root: true,
  extends: ['@repo/eslint-config'],
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
  ignorePatterns: ['dist', 'node_modules', '.turbo', '*.config.js'],
};
