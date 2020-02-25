module.exports = {
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /(node_modules)/,
        loader: 'babel-loader',
        options: {
          presets: ['@babel/preset-env'],
          plugins: [
            [
              '@babel/plugin-transform-modules-commonjs',
              {
                allowTopLevelThis: true,
              },
            ],
            [
              '@babel/plugin-proposal-class-properties',
              {
                loose: true,
              },
            ],
            '@babel/plugin-proposal-object-rest-spread',
            ['@babel/plugin-transform-spread', { loose: true }],
            '@babel/plugin-transform-parameters',
            '@babel/plugin-transform-arrow-functions',
            '@babel/plugin-transform-object-assign',
            '@babel/plugin-transform-regenerator',
            '@babel/transform-runtime',
          ],
        },
      },
    ],
  },
};
