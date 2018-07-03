System.register(["osc", "path", "express", "ws", "midi-clock", "node-watch", "lodash/isEmpty"], function (exports_1, context_1) {
    "use strict";
    var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    };
    var __generator = (this && this.__generator) || function (thisArg, body) {
        var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
        return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
        function verb(n) { return function (v) { return step([n, v]); }; }
        function step(op) {
            if (f) throw new TypeError("Generator is already executing.");
            while (_) try {
                if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
                if (y = 0, t) op = [op[0] & 2, t.value];
                switch (op[0]) {
                    case 0: case 1: t = op; break;
                    case 4: _.label++; return { value: op[1], done: false };
                    case 5: _.label++; y = op[1]; op = [0]; continue;
                    case 7: op = _.ops.pop(); _.trys.pop(); continue;
                    default:
                        if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                        if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                        if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                        if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                        if (t[2]) _.ops.pop();
                        _.trys.pop(); continue;
                }
                op = body.call(thisArg, _);
            } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
            if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
        }
    };
    var _this, osc_1, path_1, express_1, ws_1, midi_clock_1, node_watch_1, isEmpty_1, fs, exampleTemplate, clc, ASCII_TEXT, debug, D_BEAT, D_FILE, D_SERVER, clock, clockIsRunning, fileChangesHashMap, loadFile, WEB_MIDI_LIB_PATH, BROWSER_WORKER_SCRIPT_PATH, BROWSER_SCRIPT_PATH, OSC_BROWSER_SCRIPT_PATH, TONAL_BROWSER_SCRIPT_PATH, TONE_LIB_BROWSER_SCRIPT, getIPAddresses, sendMIDIBeat, sendMIDITick, readFileChanges, stopClock, startClock, updateBpm;
    _this = this;
    var __moduleName = context_1 && context_1.id;
    function startServer(opts) {
        var _a = opts.port, port = _a === void 0 ? 8081 : _a, serverPath = opts.serverPath, currentDir = opts.currentDir, buffers = opts.buffers, _b = opts.init, init = _b === void 0 ? 'init.js' : _b, _c = opts.useBrowserClock, useBrowserClock = _c === void 0 ? false : _c;
        var b = buffers || 'public/_buffers';
        var SERVER_PATH = path_1["default"].resolve(serverPath);
        var BUFFERS_LOCATION = path_1["default"].join(SERVER_PATH, b);
        var INIT_FILE_NAME = b + "/" + init;
        var USE_BROWSER_CLOCK = useBrowserClock;
        console.log(ASCII_TEXT);
        D_SERVER('Starting server in: ', SERVER_PATH);
        if (!serverPath)
            throw new Error('Invalid root path!');
        var udpPort = new osc_1["default"].UDPPort({
            localAddress: '0.0.0.0',
            localPort: 57121
        });
        udpPort.on('ready', function () {
            var ipAddresses = getIPAddresses();
            var msgParts = ['OSC over UDP host: '];
            ipAddresses.forEach(function (address) {
                msgParts.push(clc.cyanBright(address + ':' + udpPort.options.localPort));
            });
            console.log.apply(console, msgParts);
            console.log('browser host: ', clc.cyanBright("http://localhost:" + port));
            console.log('loops path: ', clc.cyanBright("" + buffers));
        });
        udpPort.open();
        var appResources = serverPath;
        var nodeModules = path_1["default"].join(__dirname, '..', 'node_modules');
        var app = express_1["default"]();
        var server = app.listen(port);
        var wss = new ws_1["default"].Server({
            server: server
        });
        app.use(express_1["default"].json());
        app.use('/', express_1["default"].static(appResources));
        app.use('/node_modules/', express_1["default"].static(nodeModules));
        app.use('/src/', express_1["default"].static(__dirname));
        app.get('/', function (req, res) {
            res.send(exampleTemplate({
                BUFFER_PATH: b,
                USE_BROWSER_CLOCK: USE_BROWSER_CLOCK,
                ASCII_TEXT: ASCII_TEXT
            }, [
                WEB_MIDI_LIB_PATH,
                OSC_BROWSER_SCRIPT_PATH,
                TONAL_BROWSER_SCRIPT_PATH,
                TONE_LIB_BROWSER_SCRIPT,
                BROWSER_SCRIPT_PATH,
                INIT_FILE_NAME,
            ]));
        });
        app.post('/startClock', function (req, res) {
            startClock(clock);
            res.send({ status: 'success' });
        });
        app.post('/stopClock', function (req, res) {
            stopClock(clock);
            res.send({ status: 'success' });
        });
        app.post('/updateBpm', function (req, res) {
            var bpm = (req.body || { bpm: 120 }).bpm;
            updateBpm(clock, bpm);
            D_BEAT('Tempo updated to: %d', bpm);
            res.send({ status: 'success' });
        });
        wss.on('connection', function (socket) {
            D_SERVER('A browser client has connected via WebSockets!');
            var socketPort = new osc_1["default"].WebSocketPort({
                socket: socket
            });
            var relay = new osc_1["default"].Relay(udpPort, socketPort, {
                raw: true
            });
            startClock(clock);
            var beatCallback = function (position) {
                var microPos = position % 24;
                if (!USE_BROWSER_CLOCK) {
                    sendMIDITick(socketPort)["catch"](function (e) { return unbindCallback(); });
                }
                if (microPos === 0) {
                    if (!USE_BROWSER_CLOCK) {
                        D_BEAT('Beat: %d', position / 24);
                        sendMIDIBeat(socketPort)["catch"](function (e) { return unbindCallback(); });
                    }
                    readFileChanges(socketPort)["catch"](function (e) { return unbindCallback(); });
                }
            };
            var unbindCallback = function () {
                clock.removeListener('position', beatCallback);
            };
            clock.on('position', beatCallback);
        });
        node_watch_1["default"]("" + BUFFERS_LOCATION, { recursive: false }, function (evt, name) {
            var bufferName = name.replace(SERVER_PATH, '');
            D_FILE('%s changed.', bufferName);
            fileChangesHashMap[bufferName] = true;
        });
    }
    exports_1("startServer", startServer);
    return {
        setters: [
            function (osc_1_1) {
                osc_1 = osc_1_1;
            },
            function (path_1_1) {
                path_1 = path_1_1;
            },
            function (express_1_1) {
                express_1 = express_1_1;
            },
            function (ws_1_1) {
                ws_1 = ws_1_1;
            },
            function (midi_clock_1_1) {
                midi_clock_1 = midi_clock_1_1;
            },
            function (node_watch_1_1) {
                node_watch_1 = node_watch_1_1;
            },
            function (isEmpty_1_1) {
                isEmpty_1 = isEmpty_1_1;
            }
        ],
        execute: function () {
            fs = require('fs');
            exampleTemplate = require('./example.html');
            clc = require('cli-color');
            ASCII_TEXT = require('./ascii').ASCII_TEXT;
            debug = require('debug');
            D_BEAT = debug('beat');
            D_FILE = debug('file');
            D_SERVER = debug('server');
            clockIsRunning = false;
            fileChangesHashMap = {};
            loadFile = function (fileparts) {
                return fs.readFileSync(path_1["default"].join.apply(path_1["default"], fileparts)).toString();
            };
            WEB_MIDI_LIB_PATH = '/node_modules/webmidi/webmidi.min.js';
            BROWSER_WORKER_SCRIPT_PATH = '/src/browser-worker.js';
            BROWSER_SCRIPT_PATH = '/src/browser.js';
            OSC_BROWSER_SCRIPT_PATH = '/node_modules/osc/dist/osc-browser.js';
            TONAL_BROWSER_SCRIPT_PATH = '/node_modules/tonal/build/transpiled.js';
            TONE_LIB_BROWSER_SCRIPT = '/node_modules/tone/build/Tone.min.js';
            getIPAddresses = function () {
                var os = require('os');
                var interfaces = os.networkInterfaces();
                var ipAddresses = [];
                for (var deviceName in interfaces) {
                    var addresses = interfaces[deviceName];
                    for (var i = 0; i < addresses.length; i++) {
                        var addressInfo = addresses[i];
                        if (addressInfo.family === 'IPv4' && !addressInfo.internal) {
                            ipAddresses.push(addressInfo.address);
                        }
                    }
                }
                return ipAddresses;
            };
            sendMIDIBeat = function (socket) { return __awaiter(_this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    socket.send({
                        address: '/midi/beat'
                    });
                    return [2];
                });
            }); };
            sendMIDITick = function (socket) { return __awaiter(_this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    socket.send({
                        address: '/midi/tick'
                    });
                    return [2];
                });
            }); };
            readFileChanges = function (socket) { return __awaiter(_this, void 0, void 0, function () {
                var packets, f;
                return __generator(this, function (_a) {
                    if (isEmpty_1["default"](fileChangesHashMap))
                        return [2];
                    packets = [];
                    for (f in fileChangesHashMap) {
                        D_FILE('Detected change in buffer: ', f);
                        packets.push({
                            address: "/buffer/" + f
                        });
                    }
                    socket.send({
                        timeTag: osc_1["default"].timeTag(0),
                        packets: packets
                    });
                    fileChangesHashMap = {};
                    return [2];
                });
            }); };
            stopClock = function (c) {
                if (clockIsRunning) {
                    c.stop();
                    clockIsRunning = false;
                }
            };
            startClock = function (c) {
                if (!c) {
                    clock = midi_clock_1["default"]();
                    c = clock;
                }
                c.start();
                clockIsRunning = true;
            };
            updateBpm = function (c, bpm) {
                if (c && clockIsRunning) {
                    c.setTempo(bpm);
                }
            };
        }
    };
});
//# sourceMappingURL=index.js.map