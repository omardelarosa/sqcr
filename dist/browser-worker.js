var s = self;
var timerID = null;
var interval = 41;
var scheduledTicks = new Set();
s.onmessage = function (e) {
    if (e.data === 'start') {
        console.log('starting');
        timerID = setInterval(function () { return s.postMessage('tick'); }, interval);
    }
    else if (e.data.interval) {
        interval = Number(interval);
        clearInterval(timerID);
        timerID = setInterval(function () { return s.postMessage('tick'); }, interval);
    }
    else if (e.data.scheduleLoop) {
        var _a = e.data, tickID = _a.tickID, tickInterval = _a.tickInterval, queueRank = _a.queueRank;
        var tick_1 = parseInt(e.data.tickID);
        var timer_1 = setTimeout(function () {
            if (!scheduledTicks.has(timer_1))
                return;
            s.postMessage({ event: 'processLoops', tick: tick_1 });
            scheduledTicks["delete"](timer_1);
        }, queueRank * tickInterval);
        scheduledTicks.add(timer_1);
    }
    else if (e.data === 'stop') {
        console.log('stopping');
        var i_1 = 0;
        scheduledTicks.forEach(function (t) {
            i_1++;
            clearTimeout(t);
            scheduledTicks["delete"](t);
        });
        s.postMessage('canceled ticks: ' + i_1);
        clearInterval(timerID);
        timerID = null;
    }
};
s.postMessage('worker online!');
//# sourceMappingURL=browser-worker.js.map