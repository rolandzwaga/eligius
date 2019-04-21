const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

module.exports = function (env, args) {

  let libraryName = 'library';
  let minimizers = [], outputFile, devtool;

  if (args.mode === 'production') {
    minimizers.push(new UglifyJsPlugin({
      parallel: true
    }));
    outputFile = libraryName + '.min.js';
    devtool = false;
  } else {
    outputFile = libraryName + '.js';
    devtool = 'source-map';
  }

  const config = {
    entry: __dirname + '/src/index.js',
    devtool: devtool,
    output: {
      path: __dirname + '/lib',
      filename: outputFile,
      library: libraryName,
      libraryTarget: 'umd',
      umdNamedDefine: true
    },
    externals: {
      jquery: '$',
      'lottie-web': 'lottie'
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