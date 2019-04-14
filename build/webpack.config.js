const path = require('path');

const entryParam = process.argv[4];
const outputPath = path.dirname(entryParam);

console.log(entryParam);
console.log(path.resolve(outputPath, 'dist'));

module.exports = {
    entry: entryParam,
    output: {
        path: path.resolve(outputPath, 'dist'),
        filename: 'chrono-trigger-bundle.js'
    },
    modules: {
        rules: [
            {
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
            },
            {
                test: /\.html$/,
                use: ['html-loader']
            },
            {
                test: /\.(jpg|png)$/,
                use: [{
                    loader: 'file-loader',
                    options: {
                        name: '[name].[ext]',
                        outputPath: 'img/',
                        publicPath: 'img/'
                    }
                }]
            }
        ]
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: 'src/index.html'
        }),
        new CleanWebpackPlugin(['dist'])
    ]
}