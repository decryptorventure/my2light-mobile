module.exports = {
    testEnvironment: 'node',
    setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
    testMatch: ['<rootDir>/tests/**/*.test.ts', '<rootDir>/tests/**/*.test.tsx'],
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1',
        '^../../services/(.*)$': '<rootDir>/services/$1',
        '^../../lib/(.*)$': '<rootDir>/lib/$1',
        '^../../stores/(.*)$': '<rootDir>/stores/$1',
        '^../../constants/(.*)$': '<rootDir>/constants/$1',
    },
    transform: {
        '^.+\\.(ts|tsx)$': 'ts-jest',
    },
    collectCoverage: true,
    collectCoverageFrom: [
        'services/**/*.{ts,tsx}',
        'lib/**/*.{ts,tsx}',
        'stores/**/*.{ts,tsx}',
        'hooks/**/*.{ts,tsx}',
        '!**/coverage/**',
        '!**/node_modules/**',
    ],
};
