/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.ts', '**/tests/**/*.test.js'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      // isolatedModules: true uses ts-jest's transpile-only mode (faster, no type checking)
      // Type checking is done separately via tsc --noEmit (see package.json build script)
      isolatedModules: true,
      tsconfig: {
        target: 'ES2020',
        module: 'commonjs',
        strict: true,
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        resolveJsonModule: true,
        skipLibCheck: true,
        moduleResolution: 'bundler',
      },
    }],
  },
  testTimeout: 30000,
  verbose: true,
};
