#!/usr/bin/env node
'use strict';

const meow = require('meow');
const sqcr = require('.');

const cli = meow(`
    Usage: 
        $ scqr <buffers-path>

    Options:
        --buffers, -bf  specify location of buffer.js files
        --port, -p      specify port number
        --bpm, -b       initial BPM
        --path, -d      specify root path of server
        --example, -e  run example: "midi" or "webaudio"
        --init, -i      init file name
`, {
    flags: {
        port: {
            type: 'number',
            alias: 'p'
        },
        bpm: {
            type: 'number',
            alias: 'b'
        },
        path: {
            type: 'string',
            alias: 'd'
        },
        buffers: {
            type: 'string',
            alias: 'bf'
        },
        example: {
            type: 'string',
            alias: 'e'
        },
        init: {
            type: 'string',
            alias: 'i'
        }
    }
});

if (cli.flags.help || cli.flags.h || !cli.input[0]) {
    cli.showHelp();
} else {
    sqcr(cli.input, cli.flags);
}
