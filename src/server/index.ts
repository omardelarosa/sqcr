import * as path from 'path';
import * as express from 'express';
import * as WebSocket from 'ws';
import * as fs from 'fs';
import { isEmpty } from 'lodash';

import { exampleTemplate } from '../templates/example.html';
import { ASCII_TEXT } from '../templates/ascii';

// Non-TS modules
const osc = require('osc');
const MidiClock = require('midi-clock');
const watch = require('node-watch');
const clc = require('cli-color');

const debug = require('debug');

// DEBUGGERS
const D_BEAT = debug('beat');
const D_FILE = debug('file');
const D_SERVER = debug('server');

let clock;
let clockIsRunning = false;
let fileChangesHashMap = {};

// TODO: avoid loading the entire file into memory
const loadFile = fileparts =>
    fs.readFileSync(path.join(...fileparts)).toString();

// Libraries -- TODO make this configurable via json file
const WEB_MIDI_LIB_PATH = '/node_modules/webmidi/webmidi.min.js';
const BROWSER_WORKER_SCRIPT_PATH = '/lib/worker.js';
const BROWSER_SCRIPT_PATH = '/lib/browser.js';
const OSC_BROWSER_SCRIPT_PATH = '/node_modules/osc/dist/osc-browser.js';
const TONAL_BROWSER_SCRIPT_PATH = '/node_modules/tonal/build/transpiled.js';
const TONE_LIB_BROWSER_SCRIPT = '/node_modules/tone/build/Tone.min.js';

const getIPAddresses = () => {
    const os = require('os');
    const interfaces = os.networkInterfaces();
    const ipAddresses = [];

    for (let deviceName in interfaces) {
        const addresses = interfaces[deviceName];
        for (let i = 0; i < addresses.length; i++) {
            const addressInfo = addresses[i];
            if (addressInfo.family === 'IPv4' && !addressInfo.internal) {
                ipAddresses.push(addressInfo.address);
            }
        }
    }

    return ipAddresses;
};

const sendMIDIBeat = async socket => {
    socket.send({
        address: '/midi/beat',
    });
};

const sendMIDITick = async socket => {
    socket.send({
        address: '/midi/tick',
    });
};

const readFileChanges = async socket => {
    if (isEmpty(fileChangesHashMap)) return;
    const packets = [];
    for (let f in fileChangesHashMap) {
        D_FILE('Detected change in buffer: ', f);
        packets.push({
            address: `/buffer/${f}`,
        });
    }
    // Clearing map
    socket.send({
        timeTag: osc.timeTag(0),
        packets,
    });

    fileChangesHashMap = {};
};

const stopClock = c => {
    if (clockIsRunning) {
        c.stop();
        clockIsRunning = false;
    }
};

const startClock = c => {
    if (!c) {
        clock = MidiClock();
        c = clock;
    }
    c.start();
    clockIsRunning = true;
};

const updateBpm = (c, bpm) => {
    if (c && clockIsRunning) {
        c.setTempo(bpm);
    }
};

interface ServerOptions {
    port: number;
    serverPath?: string;
    currentDir?: string;
    buffers?: string;
    init?: string;
    useBrowserClock: boolean;
}

// Create an Express-based Web Socket server to which OSC messages will be relayed.
export function startServer(opts: ServerOptions) {
    const {
        port = 8081,
        serverPath,
        currentDir,
        buffers,
        init = 'init.js',
        useBrowserClock = false,
    } = opts;

    const b = buffers || 'public/_buffers';
    const SERVER_PATH = path.resolve(serverPath);
    const BUFFERS_LOCATION = path.join(SERVER_PATH, b);
    const INIT_FILE_NAME = `${b}/${init}`;
    const USE_BROWSER_CLOCK = useBrowserClock;

    console.log(ASCII_TEXT);

    D_SERVER('Starting server in: ', SERVER_PATH);

    if (!serverPath) throw new Error('Invalid root path!');

    // Bind to a UDP socket to listen for incoming OSC events.
    const udpPort = new osc.UDPPort({
        localAddress: '0.0.0.0',
        localPort: 57121,
    });

    udpPort.on('ready', () => {
        var ipAddresses = getIPAddresses();
        const msgParts = ['OSC over UDP host: '];
        ipAddresses.forEach(address => {
            msgParts.push(
                clc.cyanBright(address + ':' + udpPort.options.localPort),
            );
        });
        console.log(...msgParts);
        console.log(
            'browser host: ',
            clc.cyanBright(`http://localhost:${port}`),
        );
        console.log('loops path: ', clc.cyanBright(`${buffers}`));
    });

    udpPort.open();

    // Create an Express-based Web Socket server to which OSC messages will be relayed.
    const appResources = serverPath;
    const nodeModules = path.join(__dirname, '..', '..', 'node_modules');
    const libPath = path.join(__dirname, '..', '..', 'lib');

    const app = express();
    const server = app.listen(port);
    const wss = new WebSocket.Server({
        server: server,
    });

    app.use(express.json()); // Support JSON post body

    // static libs
    app.use('/', express.static(appResources));

    // Serve node_modules for libs, etc
    app.use('/node_modules/', express.static(nodeModules));

    // Serve src for libs, etc
    app.use('/lib/', express.static(libPath));

    // fall back to example example page
    app.get('/', (req, res) => {
        res.send(
            exampleTemplate(
                {
                    BUFFER_PATH: b,
                    USE_BROWSER_CLOCK,
                    ASCII_TEXT,
                },
                [
                    WEB_MIDI_LIB_PATH,
                    OSC_BROWSER_SCRIPT_PATH,
                    TONAL_BROWSER_SCRIPT_PATH,
                    TONE_LIB_BROWSER_SCRIPT,
                    BROWSER_SCRIPT_PATH,
                    INIT_FILE_NAME,
                ],
            ),
        );
    });

    app.post('/startClock', (req, res) => {
        startClock(clock);
        res.send({ status: 'success' });
    });

    app.post('/stopClock', (req, res) => {
        stopClock(clock);
        res.send({ status: 'success' });
    });

    app.post('/updateBpm', (req, res) => {
        const { bpm } = req.body || { bpm: 120 };
        updateBpm(clock, bpm);
        D_BEAT('Tempo updated to: %d', bpm);
        res.send({ status: 'success' });
    });

    wss.on('connection', socket => {
        D_SERVER('A browser client has connected via WebSockets!');
        var socketPort = new osc.WebSocketPort({
            socket: socket,
        });

        var relay = new osc.Relay(udpPort, socketPort, {
            raw: true,
        });

        startClock(clock);

        const beatCallback = position => {
            const microPos = position % 24; // 24 ticks per event
            if (!USE_BROWSER_CLOCK) {
                sendMIDITick(socketPort).catch(e => unbindCallback());
            }
            if (microPos === 0) {
                // TODO: better handle closing of browser tabs
                if (!USE_BROWSER_CLOCK) {
                    D_BEAT('Beat: %d', position / 24);
                    sendMIDIBeat(socketPort).catch(e => unbindCallback());
                }
                readFileChanges(socketPort).catch(e => unbindCallback());
            }
        };

        const unbindCallback = () => {
            clock.removeListener('position', beatCallback);
        };

        clock.on('position', beatCallback);
    });

    watch(`${BUFFERS_LOCATION}`, { recursive: false }, (evt, name) => {
        const bufferName = name.replace(SERVER_PATH, '');
        D_FILE('%s changed.', bufferName);
        fileChangesHashMap[bufferName] = true;
    });
}
