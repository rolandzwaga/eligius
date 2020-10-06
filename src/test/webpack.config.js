module.exports = {
  module: {
    rules: [
      {
        test: /\.ts?$|\.js$|/,
        use: 'awesome-typescript-loader?configFileName=tsconfig.test.json',
        exclude: /node_modules/,
      },
    ],
  },
};
