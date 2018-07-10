const path = require('path');
const tsConfig = require('../src/browser/tsconfig.json');

const baseConfig = {
    mode: 'production',
    resolve: {
        // Add `.ts` and `.tsx` as a resolvable extension.
        extensions: ['.ts', '.tsx', '.js'],
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                loader: 'ts-loader',
            },
        ],
    },
};

module.exports = [
    // Configure browser client
    {
        ...baseConfig,
        entry: './src/browser/Client.ts',
        output: {
            path: path.resolve(__dirname, '../lib'),
            filename: 'browser.js',
            libraryExport: 'default',
            library: 'SQCR',
        },
        externals: {
            osc: 'osc',
            'web-midi': 'WebMidi',
        },
    },
    // Configure webworker
    {
        ...baseConfig,
        entry: './src/browser/Timing.worker.ts',
        target: 'webworker',
        output: {
            path: path.resolve(__dirname, '../lib'),
            filename: 'worker.js',
        },
    },
];
