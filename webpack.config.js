const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const path = require('path');

module.exports = function (env, args) {
  let libraryName = 'library';
  let minimizers = [],
    outputFile;

  if (args.mode === 'production') {
    minimizers.push(
      new UglifyJsPlugin({
        parallel: true,
        sourceMap: true,
      })
    );
    outputFile = libraryName + '.min.js';
  } else {
    outputFile = libraryName + '.js';
  }

  const config = {
    entry: path.join(__dirname, 'src/index.js'),
    devtool: 'source-map',
    output: {
      path: path.join(__dirname, 'lib'),
      filename: outputFile,
      library: libraryName,
      libraryTarget: 'umd',
      umdNamedDefine: true,
    },
    externals: {
      jquery: { amd: 'jquery', global: 'jQuery', commonjs: 'jquery', commonjs2: 'jquery' },
      'lottie-web': { amd: 'lottie-web', global: 'lottie', commonjs: 'lottie-web', commonjs2: 'lottie-web' },
      mousetrap: { amd: 'mousetrap', global: 'Mousetrap', commonjs: 'mousetrap', commonjs2: 'mousetrap' },
      d3: { amd: 'd3', global: 'd3', commonjs: 'd3', commonjs2: 'd3' },
      uuid: { amd: 'uuid', global: 'uuid', commonjs: 'uuid', commonjs2: 'uuid' },
    },
    module: {
      rules: [
        {
          test: /\.tsx?$|\.js$|/,
          use: 'ts-loader',
          exclude: /(node_modules)/,
        },
      ],
    },
    resolve: {
      extensions: ['.tsx', '.ts', '.js'],
    },
    optimization: {
      minimizer: minimizers,
    },
  };

  return config;
};
