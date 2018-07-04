const path = require('path');
const tsConfig = require('../src/browser/tsconfig.json');

module.exports = {
    mode: 'production',
    entry: './src/browser/loader.ts',
    output: {
        path: path.resolve(__dirname, '../lib'),
        filename: 'browser.js',
    },
    resolve: {
        // Add `.ts` and `.tsx` as a resolvable extension.
        extensions: ['.ts', '.tsx', '.js'],
    },
    module: {
        rules: [
            // all files with a `.ts` or `.tsx` extension will be handled by `ts-loader`
            {
                test: /\.tsx?$/,
                loader: 'ts-loader',
            },
        ],
    },
};
