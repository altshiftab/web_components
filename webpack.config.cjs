const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
    mode: 'none',
    entry: {
        box: './src/box.ts',
        button: './src/button.ts',
        footer: './src/footer.ts',
        header: './src/header.ts',
        switch: './src/switch.ts',
    },
    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, 'dist'),
        clean: true,
        library: {
            type: 'module'
        }
    },
    experiments: {
        outputModule: true
    },
    optimization: {
        minimize: true,
        usedExports: false,
        minimizer: [
            new TerserPlugin({
                terserOptions: {
                    compress: true,
                },
                extractComments: false,
            })
        ],
        splitChunks: {
            chunks: 'all',
        },
    },
    resolve: {
        extensions: ['.ts', '.js'],
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: [
                    {
                        loader: "@altshiftab/minify_lit"
                    },
                    {
                        loader: 'babel-loader',
                        options: {
                            presets: [
                                ["@babel/preset-env", {
                                    targets: ["last 2 versions", "not dead"]
                                }],
                                "@babel/preset-typescript"
                            ],
                            "plugins": [
                                "@babel/plugin-transform-class-static-block",
                                "@babel/plugin-transform-private-methods"
                            ]
                        }
                    },
                    {
                        loader: "ts-loader",
                    }
                ],
                exclude: /node_modules/,
            }
        ],
    },
    externals: {
        'lit': 'lit' ,
        "lit/decorators.js": 'litDecorators',
        '@altshiftab/web_components/box': 'altshiftBox',
        '@altshiftab/web_components/switch': 'altshiftSwitch',
    }
};
