var AudioContext = window.AudioContext || window.webkitAudioContext;
var context = new AudioContext();

const DEFAULT_BPM = 60;
let timerWorker = null;
let __browserBPM = null;
let HAS_STOPPED = false;
let DEFAULT_TICKS_TO_SCHEDULE = 100;

const calcTickInterval = bpm => parseInt((60 * 1000) / bpm / 24);

let __tickInterval = calcTickInterval(DEFAULT_BPM);

// Utility functions
const sqcr = {
    start() {
        HAS_STOPPED = false;
        timerWorker.postMessage('start');
    },
    stop() {
        HAS_STOPPED = true;
        timerWorker.postMessage('stop');
    },
};

window.sqcr = sqcr;

// Custom event dispatcher
function Dispatcher(options) {
    // TODO: do this without a DOM using EventEmitter
    const target = document.createTextNode(null);

    this.addEventListener = target.addEventListener.bind(target);
    this.removeEventListener = target.removeEventListener.bind(target);
    this.dispatchEvent = target.dispatchEvent.bind(target);

    // Other constructor stuff...
}

let dispatcher = new Dispatcher();

// Things to do on the tick
const handleTick = ev => {
    const t = ++tick;
    // const sequenceId = ev.detail.sequenceId;
    scheduleTicks(DEFAULT_TICKS_TO_SCHEDULE, t + 0);
};

// Things to do on the beat
const handleBeat = ev => {
    drainRegisterLoopQueue();
};

dispatcher.addEventListener('tick', handleTick);
dispatcher.addEventListener('beat', handleBeat);

let tick = 0;
let T = 24; // Ticks in beat
let sleeps = 0;

// TODO: make this flag "scoped" to each loop
let loops = {};

class Loop {
    constructor({ handler, name }) {
        this.isSleeping = false;
        this.lastTickCalled = -1;
        this.handler = handler;
        this.name = name;
        this.ticksToSleep = -1;
        // TODO: add clean up logic
        this.isDead = false;
    }

    sleep(amount) {
        this.ticksToSleep = amount;
        this.isSleeping = true;
        return new Promise((resolve, reject) => {});
    }

    destroy() {
        this.isDead = true;
        this.handler = null;
    }

    run(t) {
        this.tick = t;
        // Decrementer must be at the begging to account for 0th tick in sleep cycle
        this.ticksToSleep--;
        if (this.ticksToSleep <= 0) {
            this.isSleeping = false;
        }

        // Only call if not sleeping, not dead and has not been called this tick
        if (!this.isSleeping && !this.isDead && this.lastTickCalled !== t) {
            this.lastTickCalled = t;
            this.handler(this);
        }
    }
}

const newLoopsQueue = [];

const drainRegisterLoopQueue = () => {
    while (newLoopsQueue.length > 0) {
        const { name, handler } = newLoopsQueue.pop();
        // Cleanup if exists
        if (loops[name]) {
            const oldLoop = loops[name];
            oldLoop.destroy();
            delete loops[name];
        }
        loops[name] = new Loop({ name, handler });
    }
};

// Registers loops
function loop(name, handler) {
    // Queue them up to be updated on the beat
    newLoopsQueue.push({ name, handler });
}

// TODO: make sleep scoped to each loop
// TODO: break this out into a primitive operation
const sleep = ticks => new Promise();

function setTempo(bpm) {
    if (USE_BROWSER_CLOCK) {
        __browserBPM = bpm;
        __tickInterval = calcTickInterval(bpm);
        timerWorker.postMessage({ interval: __tickInterval });
        return;
    }

    // If no worker is being used...
    fetch(`http://${window.location.host}/updateBpm`, {
        method: 'POST',
        headers: {
            'content-type': 'application/json',
        },
        body: JSON.stringify({ bpm }),
    }).then(res => {
        console.log('BPM updated', res.json());
    });
}

const playNote = n => {
    oscillator = context.createOscillator();
    oscillator.type = 'sine';
    oscillator.frequency.value = n;
    oscillator.connect(context.destination);
    oscillator.start(0);

    setTimeout(() => {
        oscillator.stop(0);
    }, 100);
};

const loadBuffer = b => {
    const $buffers = document.querySelectorAll('.buffer-script');
    $buffers.forEach(b => b.remove());
    const $buffer = document.createElement('script');
    const ts = Date.now();
    $buffer.src = `${b}?${ts}`;
    $buffer.className = 'buffer-script';
    document.body.appendChild($buffer);
    // Cancel any pending loop invokations
};

let pendingTicks = new Set();

// TODO: make scheduled ticks cancellable
const processLoops = t => {
    // TODO: Handle case of loop has already been called on this tick

    const start = Date.now();
    // Limit duration of this invokation with timeout to preserve time
    Object.keys(loops).forEach(loopName => {
        loops[loopName].run(t);
    });

    pendingTicks.delete(t);
};

const bufferQueue = [];

const processBuffers = () => {
    while (bufferQueue.length) {
        loadBuffer(bufferQueue.shift());
    }
};

// DATA container
let data = [];
let avgGap = 0;
let minLatency = 10;
let lastBeat = 0;
let lastTimeDelta = 0;
let minDelta = 0;
let lastScheduled = Date.now();
let lookahead = 1000;

let beatCounter = 0;

function scheduleTicks(numTicks, currentTick) {
    const now = Date.now();
    const since = now - lastScheduled;
    if (since > lookahead) {
        console.log('scheduling');
        if (HAS_STOPPED) return;
        // const ticksToSchedule = parseInt(lookahead / __tickInterval);
        const ticksToSchedule = numTicks;
        let i = 0;
        while (i <= ticksToSchedule + 1) {
            let t = parseInt(currentTick);
            let s = t + i;
            if (pendingTicks.has(s)) {
                i++;
                // Do not schedule...
                continue;
            }
            scheduleTick(s, i);
            i++;
        }
        // Once per "cycle", more CPU heavy
        processBuffers();
        lastScheduled = now;
    }
}

function doTick() {}

function scheduleTick(t, queueRank) {
    pendingTicks.add(t);
    timerWorker.postMessage({
        scheduleLoop: true,
        tickID: t,
        queueRank,
        tickInterval: __tickInterval,
    });
}

// TODO: create central event dispatcher

// OSC.js stuff
const handleMessage = msg => {
    // Message type 1
    const msgParts = msg.address.split('/');
    if (msgParts[1] === 'buffer') {
        // slow
        console.log('loop change detected');
        bufferQueue.push(msgParts.slice(2).join('/'));
    }

    // Message type 2
    if (msgParts[1] === 'midi') {
        if (msgParts[2] === 'beat' || tick % 24 === 0) {
            beatCounter++;
            const evt = new CustomEvent('beat', {
                detail: {
                    // sequenceId: beatCounter
                },
            });
            dispatcher.dispatchEvent(evt);
        }

        if (msgParts[2] === 'tick') {
            const evt = new CustomEvent('tick', {
                detail: {
                    // sequenceId: ++tick
                },
            });
            dispatcher.dispatchEvent(evt);
        }
    }
};

const initClock = () => {
    // Use web-worker for client-beat instead of backend worker
    if (USE_BROWSER_CLOCK) {
        timerWorker = new Worker('/src/browser-worker.js');
        timerWorker.onmessage = e => {
            if (e.data === 'tick') {
                handleMessage({ address: '/midi/tick' });
            } else if (e.data && e.data.event === 'processLoops') {
                const { tick: tickToProcess } = e.data;
                processLoops(tickToProcess);
            } else {
                console.log('message', e.data);
            }
        };

        timerWorker.postMessage('start');
    }

    // Init container

    // Init port
    oscPort = new osc.WebSocketPort({
        url: `ws://${window.location.host}`,
    });

    // listen
    oscPort.on('message', msg => {
        handleMessage(msg); // Debugging
    });

    // open port
    oscPort.open();
};

// used later to start OSC
window.initClock = initClock();

// Additional code below

const getOutputs = () => {
    if (WebMidi.enabled) {
        return WebMidi.outputs;
    } else {
        return [];
    }
};

// MIDI Testing
WebMidi.enable(function(err) {
    if (err) {
        console.log('WebMidi could not be enabled.', err);
    } else {
        console.log('WebMidi enabled!');
    }
});
