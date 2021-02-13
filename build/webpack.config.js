const HtmlWebpackPlugin = require('html-webpack-plugin');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');
const webpack = require('webpack');
const path = require('path');

module.exports = (env) => {
  const entryParam = env.entryPath;
  const outputPath = path.dirname(entryParam);

  return {
    entry: path.resolve(__dirname, '../', entryParam),
    output: {
      path: path.resolve(outputPath, 'dist'),
      filename: 'chrono-trigger-bundle.js',
    },
    devtool: 'cheap-module-source-map',
    module: {
      rules: [
        {
          test: /\.ts?$|/,
          use: 'awesome-typescript-loader',
          exclude: /node_modules/,
        },
        {
          test: /\.html$/,
          exclude: /(node_modules)/,
          use: ['html-loader'],
        },
        {
          test: /\.(jpg|png|gif)$/,
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
      plugins: [new TsconfigPathsPlugin()],
      extensions: ['.ts', '.js'],
    },
    plugins: [
      new webpack.ProgressPlugin(),
      new HtmlWebpackPlugin({
        template: 'build/template-index.html',
      }),
    ],
  };
};
