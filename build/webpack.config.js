const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');
const path = require('path');

module.exports = (env) => {

    const entryParam = env.entryPath;
    const outputPath = path.dirname(entryParam);

    return {
        entry: path.resolve(__dirname, '../'+entryParam),
        output: {
            path: path.resolve(outputPath, 'dist'),
            filename: 'chrono-trigger-bundle.js'
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
                                "@babel/plugin-proposal-object-rest-spread"
                            ]
                        }
                    }]
                },
                {
                    test: /\.html$/,
                    exclude: /(node_modules)/,
                    use: ['html-loader']
                },
                {
                    test: /\.(jpg|png)$/,
                    exclude: /(node_modules)/,
                    use: [{
                        loader: 'file-loader',
                        options: {
                            name: '[name].[ext]',
                            outputPath: 'img/',
                            publicPath: 'img/'
                        }
                    }]
                },
                {
                    test: /\.css$/,
                    use: ['css-loader']
                }
            ]
        },
        plugins: [
            new webpack.ProgressPlugin(),
            new HtmlWebpackPlugin({
                template: 'build/template-index.html'
            })
        ]
    }
}
