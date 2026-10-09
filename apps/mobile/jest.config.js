module.exports = {
  preset: 'jest-expo',
  transformIgnorePatterns: [],
  moduleNameMapper: {
    '^@react-native-async-storage/async-storage$': '<rootDir>/__mocks__/async-storage.ts',
  },
  testPathIgnorePatterns: ['/node_modules/', '/e2e/'],
  setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect'],
};
