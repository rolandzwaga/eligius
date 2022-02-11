module.exports = {
  displayName: {
    name: 'ELEGIUS',
    color: 'cyan',
  },
  moduleNameMapper: {},
  setupFiles: ['jest-canvas-mock'],
  // setupFilesAfterEnv: ['./jest.setup.js'],
  testEnvironment: 'jsdom',
  testMatch: ['<rootDir>/**/*.spec.[jt]s?(x)'],
  transform: {
    '^.+\\.[jt]sx?$': 'babel-jest',
  },
  verbose: true,
};
