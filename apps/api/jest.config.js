/**
 * Lean Jest config for the API. Runs unit tests that don't need a live
 * Postgres — the e2e tests in test/ use a separate config.
 */
/** @type {import('jest').Config} */
module.exports = {
  rootDir: 'src',
  moduleFileExtensions: ['js', 'json', 'ts'],
  testRegex: '.*\\.spec\\.ts$',
  transform: { '^.+\\.(t|j)s$': 'ts-jest' },
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  passWithNoTests: true,
};
