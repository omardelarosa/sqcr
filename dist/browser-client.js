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
System.register("Loop", [], function (exports_1, context_1) {
    "use strict";
    var Loop;
    var __moduleName = context_1 && context_1.id;
    return {
        setters: [],
        execute: function () {
            Loop = (function () {
                function Loop(_a) {
                    var handler = _a.handler, name = _a.name;
                    this.isSleeping = false;
                    this.ticksToSleep = -1;
                    this.lastTickCalled = -1;
                    this.handler = handler;
                    this.name = name;
                    this.isDead = false;
                }
                Loop.prototype.sleep = function (amount) {
                    this.ticksToSleep = amount;
                    this.isSleeping = true;
                    return new Promise(function (resolve, reject) { });
                };
                Loop.prototype.destroy = function () {
                    this.isDead = true;
                    this.handler = null;
                };
                Loop.prototype.run = function (t) {
                    this.tick = t;
                    this.ticksToSleep--;
                    if (this.ticksToSleep <= 0) {
                        this.isSleeping = false;
                    }
                    if (!this.isSleeping && !this.isDead && this.lastTickCalled !== t) {
                        this.lastTickCalled = t;
                        this.handler(this);
                    }
                };
                return Loop;
            }());
            exports_1("Loop", Loop);
        }
    };
});
System.register("Dispatcher", [], function (exports_2, context_2) {
    "use strict";
    var Dispatcher;
    var __moduleName = context_2 && context_2.id;
    return {
        setters: [],
        execute: function () {
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
            exports_2("Dispatcher", Dispatcher);
        }
    };
});
System.register("index", ["./custom_typings", "Loop", "Dispatcher"], function (exports_3, context_3) {
    "use strict";
    var Loop_1, Dispatcher_1, DEFAULT_BPM, DEFAULT_LOOKAHEAD_MS, DEFAULT_TICK_RESOLUTION, EVENTS, calcTickInterval, BrowserClient;
    var __moduleName = context_3 && context_3.id;
    return {
        setters: [
            function (_1) {
            },
            function (Loop_1_1) {
                Loop_1 = Loop_1_1;
            },
            function (Dispatcher_1_1) {
                Dispatcher_1 = Dispatcher_1_1;
            }
        ],
        execute: function () {
            DEFAULT_BPM = 60;
            DEFAULT_LOOKAHEAD_MS = 1000;
            DEFAULT_TICK_RESOLUTION = 24;
            EVENTS = {
                TICK: 'TICK',
                BEAT: 'BEAT'
            };
            calcTickInterval = function (bpm) {
                return (60 * 1000) / bpm / DEFAULT_TICK_RESOLUTION;
            };
            BrowserClient = (function () {
                function BrowserClient() {
                    var _this = this;
                    this.timerWorker = null;
                    this.oscillator = null;
                    this.pendingTicks = new Set();
                    this.hasStopped = false;
                    this.dispatcher = null;
                    this.bufferQueue = [];
                    this.newLoopsQueue = [];
                    this.tick = 0;
                    this.beat = 0;
                    this.loops = {};
                    this.T = DEFAULT_TICK_RESOLUTION;
                    this.M = 4 * DEFAULT_TICK_RESOLUTION;
                    this.onTick = function (ev) {
                        _this.incrementTicks();
                        _this.scheduleTick(BrowserClient.DEFAULT_TICKS_TO_SCHEDULE, _this.getCurrentTick());
                    };
                    this.onBeat = function (ev) {
                        _this.drainRegisterLoopQueue();
                    };
                    this.onMessage = function (msg) {
                        var address = msg.address || '';
                        var msgParts = address.split('/');
                        if (msgParts[1] === 'buffer') {
                            console.log('loop change detected');
                            _this.bufferQueue.push(msgParts.slice(2).join('/'));
                        }
                        if (msgParts[1] === 'midi') {
                            if (msgParts[2] === 'beat' || _this.tick % 24 === 0) {
                                _this.beat++;
                                var evt = new CustomEvent(EVENTS.BEAT, {});
                                _this.dispatcher.dispatchEvent(evt);
                            }
                            if (msgParts[2] === 'tick') {
                                var evt = new CustomEvent(EVENTS.TICK, {});
                                _this.dispatcher.dispatchEvent(evt);
                            }
                        }
                    };
                    this.registerLoop = function (name, handler) {
                        _this.newLoopsQueue.push({ name: name, handler: handler });
                    };
                    this.setTempo = function (bpm) {
                        if (BrowserClient.USE_BROWSER_CLOCK) {
                            BrowserClient.currentBrowserBPM = bpm;
                            _this.tickInterval = calcTickInterval(bpm);
                            _this.timerWorker.postMessage({
                                interval: _this.tickInterval
                            });
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
                    };
                    this.playNote = function (n) {
                        var context = _this.context;
                        var oscillator = context.createOscillator();
                        oscillator.type = 'sine';
                        oscillator.frequency.value = n;
                        oscillator.connect(context.destination);
                        oscillator.start(0);
                        _this.oscillator = oscillator;
                        setTimeout(function () {
                            _this.oscillator.stop(0);
                        }, 100);
                    };
                    this.getOutputs = function (WebMidi) {
                        WebMidi.enable(function (err) {
                            if (err) {
                                console.log('WebMidi could not be enabled.', err);
                            }
                            else {
                                console.log('WebMidi enabled!');
                            }
                        });
                    };
                }
                BrowserClient.prototype.init = function (options) {
                    this.setAudioContext();
                    this.setDispatcher();
                    this.setTickInterval();
                };
                BrowserClient.prototype.setDispatcher = function (D) {
                    if (D === void 0) { D = Dispatcher_1.Dispatcher; }
                    this.dispatcher = new D();
                    this.dispatcher.addEventListener(EVENTS.TICK, this.onTick);
                    this.dispatcher.addEventListener(EVENTS.BEAT, this.onBeat);
                };
                BrowserClient.prototype.setAudioContext = function (AC) {
                    if (AC === void 0) { AC = AudioContext; }
                    this.context = new AC();
                };
                BrowserClient.prototype.setTickInterval = function (bpm) {
                    if (bpm === void 0) { bpm = DEFAULT_BPM; }
                    this.tickInterval = BrowserClient.calcTickInterval(bpm);
                };
                BrowserClient.prototype.start = function () {
                    this.hasStopped = false;
                    this.timerWorker.postMessage('start');
                };
                BrowserClient.prototype.stop = function () {
                    this.hasStopped = true;
                    this.timerWorker.postMessage('stop');
                };
                BrowserClient.prototype.incrementTicks = function () {
                    this.tick++;
                };
                BrowserClient.prototype.getCurrentTick = function () {
                    return Number(this.tick);
                };
                BrowserClient.prototype.drainRegisterLoopQueue = function () {
                    while (this.newLoopsQueue.length > 0) {
                        var loops = this.loops;
                        var _a = this.newLoopsQueue.pop(), name_1 = _a.name, handler = _a.handler;
                        if (loops[name_1]) {
                            var oldLoop = loops[name_1];
                            oldLoop.destroy();
                            delete loops[name_1];
                        }
                        loops[name_1] = new Loop_1.Loop({ name: name_1, handler: handler });
                    }
                };
                BrowserClient.prototype.loadBuffer = function (b) {
                    var $buffers = document.querySelectorAll('.buffer-script');
                    Array.from($buffers).forEach(function (b) { return b.remove(); });
                    var $buffer = document.createElement('script');
                    var ts = Date.now();
                    $buffer.src = b + "?" + ts;
                    $buffer.className = 'buffer-script';
                    document.body.appendChild($buffer);
                };
                BrowserClient.prototype.processLoops = function (t) {
                    var _this = this;
                    Object.keys(this.loops).forEach(function (loopName) {
                        _this.loops[loopName].run(t);
                    });
                    this.pendingTicks["delete"](t);
                };
                BrowserClient.prototype.processBuffers = function () {
                    while (this.bufferQueue.length) {
                        this.loadBuffer(this.bufferQueue.shift());
                    }
                };
                BrowserClient.prototype.scheduleTicks = function (numTicks, currentTick) {
                    var lastScheduled = this.lastScheduledTickTimestamp || Date.now();
                    var now = Date.now();
                    var since = now - lastScheduled;
                    if (since > BrowserClient.LOOKAHEAD) {
                        console.log('scheduling');
                        if (this.hasStopped)
                            return;
                        var ticksToSchedule = numTicks;
                        var i = 0;
                        while (i <= ticksToSchedule + 1) {
                            var t = currentTick;
                            var s = t + i;
                            if (this.pendingTicks.has(s)) {
                                i++;
                                continue;
                            }
                            this.scheduleTick(s, i);
                            i++;
                        }
                        this.processBuffers();
                        this.lastScheduledTickTimestamp = now;
                    }
                };
                BrowserClient.prototype.scheduleTick = function (t, queueRank) {
                    this.pendingTicks.add(t);
                    this.timerWorker.postMessage({
                        scheduleLoop: true,
                        tickID: t,
                        queueRank: queueRank,
                        tickInterval: this.tickInterval
                    });
                };
                BrowserClient.prototype.startTimerWorker = function () {
                    var _this = this;
                    this.timerWorker = new Worker('/dist/browser-worker.js');
                    this.timerWorker.onmessage = function (e) {
                        if (e.data === 'tick') {
                            _this.onMessage({ address: '/midi/tick' });
                        }
                        else if (e.data && e.data.event === 'processLoops') {
                            var tickToProcess = e.data.tick;
                            _this.processLoops(tickToProcess);
                        }
                        else {
                            console.log('message', e.data);
                        }
                    };
                    this.timerWorker.postMessage('start');
                };
                BrowserClient.prototype.startOSCListen = function () {
                    var oscPort = new BrowserClient.OSC.WebSocketPort({
                        url: "ws://" + window.location.host
                    });
                    oscPort.on('message', this.onMessage);
                    oscPort.open();
                };
                BrowserClient.prototype.setupMIDI = function (WebMidi) {
                    WebMidi.enable(function (err) {
                        if (err) {
                            console.log('WebMidi could not be enabled.', err);
                        }
                        else {
                            console.log('WebMidi enabled!');
                        }
                    });
                };
                BrowserClient.prototype.startClock = function () {
                    if (BrowserClient.USE_BROWSER_CLOCK) {
                        this.startTimerWorker();
                    }
                    this.startOSCListen();
                };
                BrowserClient.prototype.setGlobals = function () {
                    window.loop = this.registerLoop;
                    window.setTempo = this.setTempo;
                    window.playNote = this.playNote;
                };
                BrowserClient.EVENTS = EVENTS;
                BrowserClient.LOOKAHEAD = DEFAULT_LOOKAHEAD_MS;
                BrowserClient.USE_BROWSER_CLOCK = false;
                BrowserClient.DEFAULT_BPM = DEFAULT_BPM;
                BrowserClient.DEFAULT_TICKS_TO_SCHEDULE = 100;
                BrowserClient.currentBrowserBPM = DEFAULT_BPM;
                BrowserClient.calcTickInterval = calcTickInterval;
                return BrowserClient;
            }());
            exports_3("BrowserClient", BrowserClient);
        }
    };
});
//# sourceMappingURL=browser-client.js.map