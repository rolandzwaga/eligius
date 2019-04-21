var webpack = require('webpack');
var path = require('path');
var libraryName = 'library';
var outputFile = libraryName + '.js';

var config = {
  entry: __dirname + '/src/index.js',
  devtool: 'source-map',
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
  }
};

module.exports = config;