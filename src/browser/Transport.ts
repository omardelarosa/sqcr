import { EventEmitter } from './EventEmitter';

import { OSCEvent } from './typings';

const DEFAULT_TICK_RESOLUTION = 24;
const DEFAULT_BPM = 60;
const DEFAULT_LOOKAHEAD_MS = 1000;
const DEFAULT_TIMING_WORKER_PATH = '/lib/timing.worker.js';
const calcTickInterval = (bpm: number) =>
    (60 * 1000) / bpm / DEFAULT_TICK_RESOLUTION;

const EVENTS = {
    TICK: 'TICK',
    BEAT: 'BEAT',
    BUFFER: 'BUFFER',
    PROCESS_LOOPS: 'PROCESS_LOOPS',
};

export interface IWorkerGlobalScope {
    onmessage: (e: any) => void;
    postMessage: (e: any) => void;
}

type WorkerEventName = 'midi' | 'tick' | 'buffer' | 'beat' | 'processLoops';

type WorkerEventParams =
    | 'interval'
    | 'scheduleLoop'
    | 'tickID'
    | 'tickInterval'
    | 'start'
    | 'stop'
    | 'queueRank';

type TimingAction =
    | 'start'
    | 'stop'
    | 'updateInterval'
    | 'scheduleLoop'
    | 'error';

export type TransportActions =
    | 'processLoops'
    | 'tick'
    | 'start'
    | 'stop'
    | 'updateBPM';

export interface WorkerEvent {
    name?: WorkerEventName;
    address?: string; // TODO: depricate/normalize this for server events
    data: {
        action: TimingAction;
        payload: any;
    };
}

class TimingManager {
    public timerID: number;
    public interval: number;
    public scheduledTicks: Set<number>;
    private bpm: number;
    private ctx: IWorkerGlobalScope;

    constructor(bpm: number, ctx: IWorkerGlobalScope) {
        this.bpm = bpm;
        this.timerID = 0;
        this.setBPM({ bpm });
        this.scheduledTicks = new Set();
        this.ctx = ctx;
    }

    public onError(message: string) {
        this.ctx.postMessage({ event: 'error', message });
    }

    public onEvent(e: WorkerEvent) {
        const actionName: TimingAction = (e.data && e.data.action) || 'error';

        if (actionName === 'error') {
            this.onError(`Unsupport timing action ${actionName}`);
            return;
        }

        switch (actionName) {
            case 'start':
                this.start(e.data.payload);
                break;
            case 'updateInterval':
                this.updateInterval(e.data.payload);
                break;
            case 'stop':
                this.stop();
                break;
            default:
                console.warn('Worker received unhandled action: ' + actionName);
                break;
        }
    }

    public setBPM({ bpm }) {
        this.interval = calcTickInterval(bpm);
    }

    private updateInterval({ bpm }) {
        clearInterval(this.timerID);
        this.setBPM(bpm);

        // Schedules ticks on each beat
        const schedulingFrequency = DEFAULT_TICK_RESOLUTION * this.interval;

        this.timerID = setInterval(() => {
            // Schedules all ticks for the next period
            this.scheduleTicks();
        }, schedulingFrequency);
    }

    private start({ bpm }) {
        // TODO: put this behind a debug flag
        console.log('starting at BPM: ', bpm);
        this.updateInterval({ bpm });
    }

    private stop() {
        console.log('stopping');
        let i = 0;
        // Clear schedule
        this.scheduledTicks.forEach(t => {
            i++;
            clearTimeout(t);
            this.scheduledTicks.delete(t);
        });
        clearInterval(this.timerID);
        this.timerID = 0;
    }

    private scheduleTicks() {
        let tick = 1;
        let amountScheduled = 0;
        while (amountScheduled < DEFAULT_LOOKAHEAD_MS) {
            const timeUntilTick = tick * this.interval;
            let timer = setTimeout(() => {
                // Check if a timer has already been scheduled for this tick
                if (!this.scheduledTicks.has(timer)) return;
                // Emits a 'tick' event for the transport layer
                this.sendToTransport('tick');
                this.scheduledTicks.delete(timer);
            }, timeUntilTick);
            this.scheduledTicks.add(timer);
            tick++;
            amountScheduled += timeUntilTick;
        }
    }

    public sendToTransport(action: TransportActions, payload?: any) {
        this.ctx.postMessage({ action, payload });
    }
}

export const bindTimingWorkerOnMessageHandler = (
    self: IWorkerGlobalScope,
): ((e: WorkerEvent) => void) => {
    const timing = new TimingManager(DEFAULT_BPM, self);
    return (e: WorkerEvent) => {
        try {
            timing.onEvent(e);
        } catch (e) {
            // Notify re: errors
            timing.onError(e.message);
        }
    };
};

interface ITransportOptions {
    bpm?: number;
}

interface IEvent {
    name: WorkerEventName;
    data: Record<string, any>;
}

export class Transport {
    public static EVENTS = EVENTS;
    public static DEFAULT_TICK_RESOLUTION = DEFAULT_TICK_RESOLUTION;
    public static DEFAULT_LOOKAHEAD_MS = DEFAULT_LOOKAHEAD_MS;
    public static DEFAULT_BPM = DEFAULT_BPM;
    public events: EventEmitter = null;
    private timerWorker: Worker;
    private beat: number = 0;
    private tick: number = 0;
    private bpm: number = DEFAULT_BPM;

    constructor(options: ITransportOptions = {}) {
        this.events = new EventEmitter();
        this.bpm = options.bpm;
    }

    public getTick(): number {
        return +this.tick;
    }

    public getBeat(): number {
        return +this.beat;
    }

    public getBPM(): number {
        return +this.bpm;
    }

    public incrementBeat(): void {
        this.beat++;
    }

    public incrementTick(): void {
        this.tick++;
    }

    public processLoops({ tick }): void {
        console.log('TODO: processLoops!');
    }

    public sendToWorker(evtName: TimingAction, payload: any) {
        this.timerWorker.postMessage({ action: evtName, payload });
    }

    public static toEvent(msg: WorkerEvent | OSCEvent): IEvent {
        // TODO: consolidate OSC format and workerevent format
        const address = msg.address || '';
        const msgParts: string[] = address.split('/');
        return {
            name: <WorkerEventName>msgParts[1], // TODO: remove need for casting
            data: msg,
        };
    }

    public onMessage = (evt: WorkerEvent): void => {
        const EVENTS: any = Transport.EVENTS;
        const evtName = evt.name || evt.data.action;
        switch (evtName) {
            case 'buffer':
                console.log('loop change detected');
                this.events.emit(EVENTS.BUFFER, {
                    adress: evt.address,
                    payload: evt.data.payload,
                });
                break;
            case 'beat':
                this.incrementBeat();
                this.events.emit(EVENTS.BEAT, evt.data.payload);
                break;
            case 'tick':
                this.incrementTick();
                this.events.emit(EVENTS.TICK, evt.data.payload);
                break;
            case 'processLoops':
                this.events.emit(EVENTS.PROCESS_LOOPS, evt.data.payload);
            default:
                console.warn('Unhandled transport event: ', evt.name, evt);
                this.stop();
            // Nothing
        }
    };

    // TODO:
    public bindTimerWorkerListeners(
        timerWorker: Worker,
        onError?: (e: ErrorEvent) => void,
    ): void {
        timerWorker.onmessage = (evt: WorkerEvent) => {
            this.onMessage(evt);
        };

        timerWorker.onerror = onError;
    }

    public startTimerWorker(worker): void {
        this.timerWorker = worker;

        // Bind worker listeners and fallback to inline
        this.bindTimerWorkerListeners(
            this.timerWorker,

            err => {
                console.error('Worker error: ', err.message);
            },
        );

        this.start();
    }

    public start() {
        this.sendToWorker('start', { bpm: this.bpm });
    }

    public stop() {
        this.sendToWorker('stop', {});
    }

    public updateBPM(bpm) {
        this.sendToWorker('updateInterval', { bpm });
    }
}

// Static utility class
export default Transport;
