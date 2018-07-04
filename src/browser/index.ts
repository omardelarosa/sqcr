import './custom_typings';

import { Loop } from './Loop';
import { Dispatcher } from './Dispatcher';

const DEFAULT_BPM = 60;
const DEFAULT_LOOKAHEAD_MS = 1000;
const DEFAULT_TICK_RESOLUTION = 24;
const EVENTS = {
    TICK: 'TICK',
    BEAT: 'BEAT',
};

interface IBaseEvent {
    address: string;
}

interface OSCEvent extends IBaseEvent {}

interface WorkerEvent extends IBaseEvent {}

interface OSCPort {
    on: (s: string, cb: (ev: OSCEvent) => void) => void;
    open: (...args: any[]) => void;
}

interface IMessage {
    event: string;
    data: Record<string, any>;
}

interface IBrowserClientOptions {
    bpm?: number;
}

interface UnregisteredLoop {
    name: string;
    handler: (ctx: Loop) => void;
}

const calcTickInterval = (bpm: number) =>
    (60 * 1000) / bpm / DEFAULT_TICK_RESOLUTION;

export class BrowserClient {
    public static EVENTS = EVENTS;
    public static OSC: any; // OSC.js library ref
    public static LOOKAHEAD = DEFAULT_LOOKAHEAD_MS;
    public static USE_BROWSER_CLOCK: boolean = false;
    public static DEFAULT_BPM: number = DEFAULT_BPM;
    public static DEFAULT_TICKS_TO_SCHEDULE: number = 100;
    public static currentBrowserBPM: number = DEFAULT_BPM;
    public static calcTickInterval = calcTickInterval;

    private timerWorker: any = null;
    private oscillator: OscillatorNode = null;
    private context: AudioContext;
    private lastScheduledTickTimestamp: number;
    private tickInterval: number;
    private pendingTicks: Set<number> = new Set();
    private hasStopped: boolean = false;
    private dispatcher: Dispatcher = null;
    private bufferQueue: string[] = [];
    private newLoopsQueue: UnregisteredLoop[] = []; // TODO: remove any
    private tick: number = 0;
    private beat: number = 0;
    private loops: Record<string, Loop> = {};
    private T: number = DEFAULT_TICK_RESOLUTION;
    private M: number = 4 * DEFAULT_TICK_RESOLUTION;

    constructor() {}

    public init(options: IBrowserClientOptions): void {
        this.setAudioContext();
        this.setDispatcher();
        this.setTickInterval();
        this.startClock();
    }

    public setDispatcher(D = Dispatcher) {
        this.dispatcher = new D();
        this.dispatcher.addEventListener(EVENTS.TICK, this.onTick);
        this.dispatcher.addEventListener(EVENTS.BEAT, this.onBeat);
    }

    public setAudioContext(AC = AudioContext): void {
        // Dependency injectable for testing.
        this.context = new AC();
    }

    public setTickInterval(bpm = DEFAULT_BPM): void {
        this.tickInterval = BrowserClient.calcTickInterval(bpm);
    }

    public start(): void {
        this.hasStopped = false;
        this.timerWorker.postMessage('start');
    }

    public stop(): void {
        this.hasStopped = true;
        this.timerWorker.postMessage('stop');
    }

    // EVENT HANDLERS

    // aka handleTick
    public onTick = (ev: Event): void => {
        this.incrementTicks();
        this.scheduleTick(
            BrowserClient.DEFAULT_TICKS_TO_SCHEDULE,
            this.getCurrentTick(),
        );
    };

    // aka handleBeat
    public onBeat = (ev: Event): void => {
        this.drainRegisterLoopQueue();
    };

    // Process Events -- TODO: type-annotation OSC.js
    public onMessage = (msg: WorkerEvent | OSCEvent): void => {
        const address = msg.address || '';
        // Message type 1
        const msgParts: string[] = address.split('/');
        if (msgParts[1] === 'buffer') {
            // slow
            console.log('loop change detected');
            this.bufferQueue.push(msgParts.slice(2).join('/'));
        }

        // Message type 2
        if (msgParts[1] === 'midi') {
            if (msgParts[2] === 'beat' || this.tick % 24 === 0) {
                this.beat++;
                const evt = new CustomEvent(EVENTS.BEAT, {});
                this.dispatcher.dispatchEvent(evt);
            }

            if (msgParts[2] === 'tick') {
                const evt = new CustomEvent(EVENTS.TICK, {});
                this.dispatcher.dispatchEvent(evt);
            }
        }
    };

    // UTILITIES
    public incrementTicks(): void {
        this.tick++;
    }

    public getCurrentTick(): number {
        // NOTE: this must not return a reference
        return Number(this.tick);
    }

    public drainRegisterLoopQueue(): void {
        while (this.newLoopsQueue.length > 0) {
            const loops = this.loops;
            const { name, handler } = this.newLoopsQueue.pop();
            // Cleanup if exists
            if (loops[name]) {
                const oldLoop = loops[name];
                oldLoop.destroy();
                delete loops[name];
            }
            loops[name] = new Loop({ name, handler });
        }
    }

    public registerLoop = (
        name: string,
        handler: (ctx: Loop) => void,
    ): void => {
        this.newLoopsQueue.push({ name, handler });
    };

    public setTempo = bpm => {
        if (BrowserClient.USE_BROWSER_CLOCK) {
            BrowserClient.currentBrowserBPM = bpm;
            this.tickInterval = calcTickInterval(bpm);
            this.timerWorker.postMessage({
                interval: this.tickInterval,
            });
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
    };

    public playNote = n => {
        const context = this.context;
        const oscillator = context.createOscillator();
        oscillator.type = 'sine';
        oscillator.frequency.value = n;
        oscillator.connect(context.destination);
        oscillator.start(0);

        this.oscillator = oscillator;
        setTimeout(() => {
            this.oscillator.stop(0);
        }, 100);
    };

    public loadBuffer(b: string) {
        const $buffers = document.querySelectorAll('.buffer-script');
        Array.from($buffers).forEach(b => b.remove());
        const $buffer = document.createElement('script');
        const ts = Date.now();
        $buffer.src = `${b}?${ts}`;
        $buffer.className = 'buffer-script';
        document.body.appendChild($buffer);
        // Cancel any pending loop invokations
    }

    public processLoops(t: number) {
        // TODO: Handle case of loop has already been called on this tick

        // Limit duration of this invokation with timeout to preserve time
        Object.keys(this.loops).forEach(loopName => {
            this.loops[loopName].run(t);
        });

        this.pendingTicks.delete(t);
    }

    public processBuffers() {
        while (this.bufferQueue.length) {
            this.loadBuffer(this.bufferQueue.shift());
        }
    }

    public scheduleTicks(numTicks: number, currentTick: number): void {
        const lastScheduled = this.lastScheduledTickTimestamp || Date.now();
        const now = Date.now();
        const since = now - lastScheduled;
        if (since > BrowserClient.LOOKAHEAD) {
            console.log('scheduling');
            if (this.hasStopped) return;
            // const ticksToSchedule = parseInt(BrowserClient.LOOKAHEAD / this.tickInterval);
            const ticksToSchedule = numTicks;
            let i = 0;
            while (i <= ticksToSchedule + 1) {
                let t = currentTick;
                let s = t + i;
                if (this.pendingTicks.has(s)) {
                    i++;
                    // Do not schedule...
                    continue;
                }
                this.scheduleTick(s, i);
                i++;
            }
            // Once per "cycle", more CPU heavy
            this.processBuffers();
            this.lastScheduledTickTimestamp = now;
        }
    }

    public scheduleTick(t: number, queueRank: number): void {
        this.pendingTicks.add(t);
        this.timerWorker.postMessage({
            scheduleLoop: true,
            tickID: t,
            queueRank,
            tickInterval: this.tickInterval,
        });
    }

    public startTimerWorker(): void {
        this.timerWorker = new Worker('/dist/browser-worker.js');
        this.timerWorker.onmessage = e => {
            if (e.data === 'tick') {
                this.onMessage({ address: '/midi/tick' });
            } else if (e.data && e.data.event === 'processLoops') {
                const { tick: tickToProcess } = e.data;
                this.processLoops(tickToProcess);
            } else {
                console.log('message', e.data);
            }
        };

        this.timerWorker.postMessage('start');
    }

    public startOSCListen(): void {
        // Init container
        let oscPort: OSCPort = new BrowserClient.OSC.WebSocketPort({
            url: `ws://${window.location.host}`,
        });

        // listen
        oscPort.on('message', this.onMessage);

        // open port
        oscPort.open();
    }

    public setupMIDI(WebMidi): void {
        // MIDI Testing
        WebMidi.enable(function(err) {
            if (err) {
                console.log('WebMidi could not be enabled.', err);
            } else {
                console.log('WebMidi enabled!');
            }
        });
    }

    public getOutputs = (WebMidi): any => {
        // MIDI Testing
        WebMidi.enable(function(err) {
            if (err) {
                console.log('WebMidi could not be enabled.', err);
            } else {
                console.log('WebMidi enabled!');
            }
        });
    };

    public startClock(): void {
        // Use web-worker for client-beat instead of backend worker
        if (BrowserClient.USE_BROWSER_CLOCK) {
            this.startTimerWorker();
        }

        this.startOSCListen();
        this.setupMIDI((<any>window).WebMidi);
    }

    // Sets window-level globals -- UH OH
    public setGlobals(): void {
        // TODO: add proper type annotations
        (<any>window).loop = this.registerLoop;
        (<any>window).setTempo = this.setTempo;
        (<any>window).playNote = this.playNote;
    }
}
