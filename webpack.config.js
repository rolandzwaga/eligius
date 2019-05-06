const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const path = require('path');

module.exports = function (env, args) {

  let libraryName = 'library';
  let minimizers = [], outputFile;

  if (args.mode === 'production') {
    minimizers.push(new UglifyJsPlugin({
      parallel: true
    }));
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
      umdNamedDefine: true
    },
    externals: {
      'jquery': { amd: 'jquery', global: 'jQuery', commonjs: 'jquery', commonjs2: 'jquery' },
      'lottie-web': { amd: 'lottie-web', global: 'lottie', commonjs: 'lottie-web', commonjs2: 'lottie-web' }
    },
    module: {
      rules: [{
        test: /\.js$/,
        exclude: /(node_modules)/,
        use: [{
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
            plugins: [
              ["@babel/plugin-transform-modules-commonjs", {
                "allowTopLevelThis": true
              }],
              ["@babel/plugin-proposal-class-properties", {
                "loose": true
              }],
              "@babel/plugin-proposal-object-rest-spread",
              "@babel/plugin-transform-arrow-functions",
              "@babel/plugin-transform-object-assign"
            ]
          }
        }]
      }]
    },
    optimization: {
      minimizer: minimizers,
    }
  };

  return config;
}