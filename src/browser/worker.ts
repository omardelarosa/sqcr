let timerID = null;
let interval = 41; // 60 BPM
let scheduledTicks = new Set();

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
        let timer = setTimeout(() => {
            if (!scheduledTicks.has(timer)) return;
            // Process loops
            postMessage({ event: 'processLoops', tick });
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
        self.postMessage('canceled ticks: ' + i);
        clearInterval(timerID);
        timerID = null;
    }
};

postMessage('worker online!');
