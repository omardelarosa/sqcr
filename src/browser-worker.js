let timerID = null;
let interval = 41; // 60 BPM

let pendingTicks = new Set();

self.onmessage = function(e) {
    if (e.data === 'start') {
        console.log('starting');
        timerID = setInterval(() => postMessage('tick'), interval);
    } else if (e.data.interval) {
        // Update interval
        interval = parseInt(interval); // Ronded to int.
        clearInterval(timerID);
        timerID = setInterval(() => postMessage('tick'), interval);
    } else if (e.data.scheduleLoop) {
        const { tickID, tickInterval, queueRank } = e.data;
        const tick = parseInt(e.data.tickID);
        setTimeout(() => {
            // Process loops
            postMessage({ event: 'processLoops', tick });
        }, queueRank * tickInterval);
        // Process loops
        // postMessage({ event: 'processLoops', tick });
    } else if (e.data === 'stop') {
        console.log('stopping');
        clearInterval(timerID);
        timerID = null;
    }
};

postMessage('worker online!');
