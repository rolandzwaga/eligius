module.exports = {
  module: {
    rules: [{
      test: /\.js$/,
      exclude: /(node_modules)/,
      loader: 'babel-loader',
      query: {
        presets: ['@babel/preset-env'],
        plugins: [
          ["@babel/plugin-transform-modules-commonjs", {
            "allowTopLevelThis": true
          }],
          "@babel/plugin-proposal-class-properties"
        ]
      }
    }]
  }
};
