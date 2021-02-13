module.exports = function (config) {
  config.set({
    basePath: '.',
    frameworks: ['jasmine', 'karma-typescript'],
    files: [{ pattern: 'src/**/*.+(ts|d.ts)' }],
    preprocessors: {
      '**/*.ts': ['karma-typescript'],
    },
    karmaTypescriptConfig: {
      tsconfig: './tsconfig.test.json',
      coverageOptions: {
        instrumentation: false,
      },
    },
    client: {
      // leave Jasmine Spec Runner output visible in browser
      clearContext: false,
      captureConsole: true,
    },
    mime: {
      'text/x-typescript': ['ts', 'd.ts'],
    },
    reporters: ['progress', 'karma-typescript'],
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,
    browsers: ['Chrome'],
    singleRun: false,
  });
};
