module.exports = function (config) {
  config.set({
    frameworks: ['jasmine', 'karma-typescript'],
    files: ['src/test/**/*.spec.ts'],
    preprocessors: {
      '**/*.ts': 'karma-typescript',
    },
    karmaTypescriptConfig: {
      compilerOptions: {
        baseUrl: '.',
        paths: {
          '~/*': ['src/*'],
        },
        noUnusedLocals: false,
        noUnusedParameters: true,
        allowSyntheticDefaultImports: true,
        esModuleInterop: true,
        allowJs: true,
        checkJs: false,
        module: 'commonjs',
        target: 'es2015',
        moduleResolution: 'node',
        lib: ['es2015', 'es6', 'es2017', 'dom'],
        outDir: 'lib',
        rootDir: 'src',
        skipLibCheck: true,
        strict: false,
        forceConsistentCasingInFileNames: true,
        resolveJsonModule: true,
        isolatedModules: true,
        noEmit: true,
        sourceMap: true,
        declaration: true,
        types: ['jasmine', 'node'],
      },
      reports: {
        'html-spa': 'coverage',
      },
    },
    reporters: ['progress', 'karma-typescript'],
    browsers: ['Chrome'],
  });
};
