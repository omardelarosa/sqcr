System.register(["./custom_typings", "./Loop"], function (exports_1, context_1) {
    "use strict";
    var __extends = (this && this.__extends) || (function () {
        var extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return function (d, b) {
            extendStatics(d, b);
            function __() { this.constructor = d; }
            d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
        };
    })();
    var Loop_1, context, DEFAULT_BPM, timerWorker, oscillator, __browserBPM, HAS_STOPPED, DEFAULT_TICKS_TO_SCHEDULE, calcTickInterval, __tickInterval, sqcr, Dispatcher, dispatcher, handleTick, handleBeat, tick, T, sleeps, loops, newLoopsQueue, drainRegisterLoopQueue, sleep, playNote, loadBuffer, pendingTicks, processLoops, bufferQueue, processBuffers, data, avgGap, minLatency, lastBeat, lastTimeDelta, minDelta, lastScheduled, lookahead, beatCounter, handleMessage, initClock, getOutputs, BrowserClient;
    var __moduleName = context_1 && context_1.id;
    function loop(name, handler) {
        newLoopsQueue.push({ name: name, handler: handler });
    }
    function setTempo(bpm) {
        if (BrowserClient.USE_BROWSER_CLOCK) {
            __browserBPM = bpm;
            __tickInterval = calcTickInterval(bpm);
            timerWorker.postMessage({ interval: __tickInterval });
            return;
        }
        fetch("http://" + window.location.host + "/updateBpm", {
            method: 'POST',
            headers: {
                'content-type': 'application/json'
            },
            body: JSON.stringify({ bpm: bpm })
        }).then(function (res) {
            console.log('BPM updated', res.json());
        });
    }
    function scheduleTicks(numTicks, currentTick) {
        var now = Date.now();
        var since = now - lastScheduled;
        if (since > lookahead) {
            console.log('scheduling');
            if (HAS_STOPPED)
                return;
            var ticksToSchedule = numTicks;
            var i = 0;
            while (i <= ticksToSchedule + 1) {
                var t = parseInt(currentTick);
                var s = t + i;
                if (pendingTicks.has(s)) {
                    i++;
                    continue;
                }
                scheduleTick(s, i);
                i++;
            }
            processBuffers();
            lastScheduled = now;
        }
    }
    function doTick() { }
    function scheduleTick(t, queueRank) {
        pendingTicks.add(t);
        timerWorker.postMessage({
            scheduleLoop: true,
            tickID: t,
            queueRank: queueRank,
            tickInterval: __tickInterval
        });
    }
    return {
        setters: [
            function (_1) {
            },
            function (Loop_1_1) {
                Loop_1 = Loop_1_1;
            }
        ],
        execute: function () {
            context = new AudioContext();
            DEFAULT_BPM = 60;
            timerWorker = null;
            oscillator = null;
            __browserBPM = null;
            HAS_STOPPED = false;
            DEFAULT_TICKS_TO_SCHEDULE = 100;
            calcTickInterval = function (bpm) { return (60 * 1000) / bpm / 24; };
            __tickInterval = calcTickInterval(DEFAULT_BPM);
            sqcr = {
                start: function () {
                    HAS_STOPPED = false;
                    timerWorker.postMessage('start');
                },
                stop: function () {
                    HAS_STOPPED = true;
                    timerWorker.postMessage('stop');
                }
            };
            Dispatcher = (function (_super) {
                __extends(Dispatcher, _super);
                function Dispatcher() {
                    var _this = _super.call(this) || this;
                    var target = document.createTextNode(null);
                    _this.addEventListener = target.addEventListener.bind(target);
                    _this.removeEventListener = target.removeEventListener.bind(target);
                    _this.dispatchEvent = target.dispatchEvent.bind(target);
                    return _this;
                }
                return Dispatcher;
            }(Node));
            dispatcher = new Dispatcher();
            handleTick = function (ev) {
                var t = ++tick;
                scheduleTicks(DEFAULT_TICKS_TO_SCHEDULE, t + 0);
            };
            handleBeat = function (ev) {
                drainRegisterLoopQueue();
            };
            dispatcher.addEventListener('tick', handleTick);
            dispatcher.addEventListener('beat', handleBeat);
            tick = 0;
            T = 24;
            sleeps = 0;
            loops = {};
            newLoopsQueue = [];
            drainRegisterLoopQueue = function () {
                while (newLoopsQueue.length > 0) {
                    var _a = newLoopsQueue.pop(), name_1 = _a.name, handler = _a.handler;
                    if (loops[name_1]) {
                        var oldLoop = loops[name_1];
                        oldLoop.destroy();
                        delete loops[name_1];
                    }
                    loops[name_1] = new Loop_1.Loop({ name: name_1, handler: handler });
                }
            };
            sleep = function (ticks) { return Promise.resolve(); };
            playNote = function (n) {
                oscillator = context.createOscillator();
                oscillator.type = 'sine';
                oscillator.frequency.value = n;
                oscillator.connect(context.destination);
                oscillator.start(0);
                setTimeout(function () {
                    oscillator.stop(0);
                }, 100);
            };
            loadBuffer = function (b) {
                var $buffers = document.querySelectorAll('.buffer-script');
                $buffers.forEach(function (b) { return b.remove(); });
                var $buffer = document.createElement('script');
                var ts = Date.now();
                $buffer.src = b + "?" + ts;
                $buffer.className = 'buffer-script';
                document.body.appendChild($buffer);
            };
            pendingTicks = new Set();
            processLoops = function (t) {
                var start = Date.now();
                Object.keys(loops).forEach(function (loopName) {
                    loops[loopName].run(t);
                });
                pendingTicks["delete"](t);
            };
            bufferQueue = [];
            processBuffers = function () {
                while (bufferQueue.length) {
                    loadBuffer(bufferQueue.shift());
                }
            };
            data = [];
            avgGap = 0;
            minLatency = 10;
            lastBeat = 0;
            lastTimeDelta = 0;
            minDelta = 0;
            lastScheduled = Date.now();
            lookahead = 1000;
            beatCounter = 0;
            handleMessage = function (msg) {
                var msgParts = msg.address.split('/');
                if (msgParts[1] === 'buffer') {
                    console.log('loop change detected');
                    bufferQueue.push(msgParts.slice(2).join('/'));
                }
                if (msgParts[1] === 'midi') {
                    if (msgParts[2] === 'beat' || tick % 24 === 0) {
                        beatCounter++;
                        var evt = new CustomEvent('beat', {
                            detail: {}
                        });
                        dispatcher.dispatchEvent(evt);
                    }
                    if (msgParts[2] === 'tick') {
                        var evt = new CustomEvent('tick', {
                            detail: {}
                        });
                        dispatcher.dispatchEvent(evt);
                    }
                }
            };
            initClock = function () {
                if (BrowserClient.USE_BROWSER_CLOCK) {
                    timerWorker = new Worker('/src/browser-worker.js');
                    timerWorker.onmessage = function (e) {
                        if (e.data === 'tick') {
                            handleMessage({ address: '/midi/tick' });
                        }
                        else if (e.data && e.data.event === 'processLoops') {
                            var tickToProcess = e.data.tick;
                            processLoops(tickToProcess);
                        }
                        else {
                            console.log('message', e.data);
                        }
                    };
                    timerWorker.postMessage('start');
                }
                oscPort = new osc.WebSocketPort({
                    url: "ws://" + window.location.host
                });
                oscPort.on('message', function (msg) {
                    handleMessage(msg);
                });
                oscPort.open();
            };
            window.initClock = initClock();
            getOutputs = function () {
                if (WebMidi.enabled) {
                    return WebMidi.outputs;
                }
                else {
                    return [];
                }
            };
            WebMidi.enable(function (err) {
                if (err) {
                    console.log('WebMidi could not be enabled.', err);
                }
                else {
                    console.log('WebMidi enabled!');
                }
            });
            BrowserClient = (function () {
                function BrowserClient(options) {
                }
                BrowserClient.USE_BROWSER_CLOCK = false;
                return BrowserClient;
            }());
            exports_1("BrowserClient", BrowserClient);
        }
    };
});
//# sourceMappingURL=index.js.map