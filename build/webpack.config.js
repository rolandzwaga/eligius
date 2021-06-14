const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');
const path = require('path');

module.exports = (_env, params) => {
  const entryParam = params.entry[0];
  const outputPath = path.dirname(entryParam);

  return {
    entry: entryParam,
    output: {
      path: path.resolve(__dirname, '../', outputPath, 'dist'),
      filename: 'chrono-trigger-bundle.js',
    },
    devtool: 'cheap-module-source-map',
    module: {
      rules: [
        {
          test: /\.ts?$|/,
          loader: 'ts-loader',
          exclude: /(node_modules)/,
          options: {
            compilerOptions: {
              plugins: [{ name: 'typescript-plugin-css-modules' }],
              include: ['./**/*'],
              exclude: ['./src/test'],
              noUnusedLocals: false,
              noUnusedParameters: true,
              allowSyntheticDefaultImports: true,
              esModuleInterop: true,
              allowJs: true,
              checkJs: false,
              module: 'commonjs',
              target: 'es2015',
              rootDir: '.',
              moduleResolution: 'node',
              lib: ['es2015', 'es6', 'es2017', 'dom'],
              outDir: 'dist',
              skipLibCheck: true,
              strict: true,
              forceConsistentCasingInFileNames: true,
              resolveJsonModule: true,
              isolatedModules: false,
              noEmit: false,
              sourceMap: true,
              declaration: true,
              typeRoots: ['./typings.d.ts'],
            },
          },
        },
        {
          test: /\.html$/,
          exclude: /(node_modules)/,
          use: ['html-loader'],
        },
        {
          test: /\.(jpg|png|gif|webp)$/,
          exclude: /(node_modules)/,
          use: [
            {
              loader: 'file-loader',
              options: {
                name: '[name].[ext]',
                outputPath: 'img/',
                publicPath: 'img/',
              },
            },
          ],
        },
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader'],
        },
        {
          test: /\.svg$/,
          use: ['svg-inline-loader'],
        },
      ],
    },
    resolve: {
      extensions: ['.ts', '.js'],
    },
    plugins: [
      new webpack.ProgressPlugin(),
      new HtmlWebpackPlugin({
        inject: true,
        template: './build/template-index.html',
        filename: 'index.html',
      }),
    ],
  };
};
