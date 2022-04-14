module.exports = {
  displayName: {
    name: 'ELIGIUS',
    color: 'cyan',
  },
  moduleNameMapper: {},
  setupFiles: ['jest-canvas-mock'],
  testEnvironment: 'jsdom',
  testMatch: ['<rootDir>/**/*.spec.[jt]s?(x)'],
  transform: {
    '^.+\\.[jt]sx?$': 'babel-jest',
  },
  verbose: true,
};
