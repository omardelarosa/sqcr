let timerID = null;
let interval = 41; // 60 BPM

self.onmessage = function(e) {
    if (e.data === 'start') {
        console.log('starting');
        timerID = setInterval(() => postMessage('tick'), interval);
    } else if (e.data.interval) {
        interval = parseInt(interval); // Ronded to int.
        clearInterval(timerID);
        timerID = setInterval(() => postMessage('tick'), interval);
    } else if (e.data === 'stop') {
        console.log('stopping');
        clearInterval(timerID);
        timerID = null;
    }
};

postMessage('worker online!');
