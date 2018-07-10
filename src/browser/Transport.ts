export interface IWorkerGlobalScope {
    onmessage: (e: any) => void;
    postMessage: (e: any) => void;
}

type WorkerEventParams =
    | 'interval'
    | 'scheduleLoop'
    | 'tickID'
    | 'tickInterval'
    | 'start'
    | 'stop'
    | 'queueRank';

export interface WorkerEvent {
    data: Record<WorkerEventParams, any>;
}

export const bindTimingWorker = (
    self: IWorkerGlobalScope,
): ((e: WorkerEvent) => void) => {
    // Private variables
    let timerID = null;
    let interval = 41; // 60 bpm
    let scheduledTicks = new Set();
    return (e: WorkerEvent) => {
        if (e.data.start) {
            console.log('starting');
            timerID = setInterval(() => self.postMessage('tick'), interval);
        } else if (e.data.interval) {
            // Update interval
            interval = Number(interval); // Ronded to int.
            clearInterval(timerID);
            timerID = setInterval(() => self.postMessage('tick'), interval);
        } else if (e.data.scheduleLoop) {
            const { tickID, tickInterval, queueRank } = e.data;
            const tick = parseInt(e.data.tickID);
            let timer = setTimeout(() => {
                if (!scheduledTicks.has(timer)) return;
                // Process loops
                self.postMessage({ event: 'processLoops', tick });
                scheduledTicks.delete(timer);
            }, queueRank * tickInterval);
            scheduledTicks.add(timer);
            // Process loops
            // postMessage({ event: 'processLoops', tick });
        } else if (e.data.stop) {
            console.log('stopping');
            let i = 0;
            // Clear schedule
            scheduledTicks.forEach(t => {
                i++;
                clearTimeout(t);
                scheduledTicks.delete(t);
            });
            self.postMessage('canceled ticks: ' + i);
            clearInterval(timerID);
            timerID = null;
        }
    };
};

// Static utility class
export default {
    bindTimingWorker,
};
