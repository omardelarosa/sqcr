// This fixes an inaccuracy in the WorkerGlobalScope typings as of TS 2.9.2
interface IWorkerGlobalScope extends WorkerGlobalScope {
    onmessage: (...args: any[]) => void;
    postMessage: (...args: any[]) => void;
}

const s = <IWorkerGlobalScope>self;

let timerID = null;
let interval = 41; // 60 BPM
let scheduledTicks = new Set();

s.onmessage = e => {
    if (e.data === 'start') {
        console.log('starting');
        timerID = setInterval(() => s.postMessage('tick'), interval);
    } else if (e.data.interval) {
        // Update interval
        interval = Number(interval); // Ronded to int.
        clearInterval(timerID);
        timerID = setInterval(() => s.postMessage('tick'), interval);
    } else if (e.data.scheduleLoop) {
        const { tickID, tickInterval, queueRank } = e.data;
        const tick = parseInt(e.data.tickID);
        let timer = setTimeout(() => {
            if (!scheduledTicks.has(timer)) return;
            // Process loops
            s.postMessage({ event: 'processLoops', tick });
            scheduledTicks.delete(timer);
        }, queueRank * tickInterval);
        scheduledTicks.add(timer);
        // Process loops
        // postMessage({ event: 'processLoops', tick });
    } else if (e.data === 'stop') {
        console.log('stopping');
        let i = 0;
        // Clear schedule
        scheduledTicks.forEach(t => {
            i++;
            clearTimeout(t);
            scheduledTicks.delete(t);
        });
        s.postMessage('canceled ticks: ' + i);
        clearInterval(timerID);
        timerID = null;
    }
};

s.postMessage('worker online!');
