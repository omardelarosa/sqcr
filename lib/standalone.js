var SQCR=function(e){var t={};function s(r){if(t[r])return t[r].exports;var i=t[r]={i:r,l:!1,exports:{}};return e[r].call(i.exports,i,i.exports,s),i.l=!0,i.exports}return s.m=e,s.c=t,s.d=function(e,t,r){s.o(e,t)||Object.defineProperty(e,t,{enumerable:!0,get:r})},s.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},s.t=function(e,t){if(1&t&&(e=s(e)),8&t)return e;if(4&t&&"object"==typeof e&&e&&e.__esModule)return e;var r=Object.create(null);if(s.r(r),Object.defineProperty(r,"default",{enumerable:!0,value:e}),2&t&&"string"!=typeof e)for(var i in e)s.d(r,i,function(t){return e[t]}.bind(null,i));return r},s.n=function(e){var t=e&&e.__esModule?function(){return e.default}:function(){return e};return s.d(t,"a",t),t},s.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},s.p="",s(s.s=6)}([function(e,t){e.exports='!function(e){var t={};function s(r){if(t[r])return t[r].exports;var i=t[r]={i:r,l:!1,exports:{}};return e[r].call(i.exports,i,i.exports,s),i.l=!0,i.exports}s.m=e,s.c=t,s.d=function(e,t,r){s.o(e,t)||Object.defineProperty(e,t,{enumerable:!0,get:r})},s.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},s.t=function(e,t){if(1&t&&(e=s(e)),8&t)return e;if(4&t&&"object"==typeof e&&e&&e.__esModule)return e;var r=Object.create(null);if(s.r(r),Object.defineProperty(r,"default",{enumerable:!0,value:e}),2&t&&"string"!=typeof e)for(var i in e)s.d(r,i,function(t){return e[t]}.bind(null,i));return r},s.n=function(e){var t=e&&e.__esModule?function(){return e.default}:function(){return e};return s.d(t,"a",t),t},s.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},s.p="",s(s.s=3)}([function(e,t,s){"use strict";Object.defineProperty(t,"__esModule",{value:!0});t.Dispatcher=class{constructor(){const e=document.createTextNode(null);this.addEventListener=e.addEventListener.bind(e),this.removeEventListener=e.removeEventListener.bind(e),this.dispatchEvent=e.dispatchEvent.bind(e)}}},function(e,t,s){"use strict";Object.defineProperty(t,"__esModule",{value:!0});const r=s(0);t.EventEmitter=class{constructor(e){this.dispatcher=e||new r.Dispatcher}on(e,t){this.dispatcher.addEventListener(e,t)}emit(e,t){const s=new CustomEvent(e,t);this.dispatcher.dispatchEvent(s)}off(e,t){this.dispatcher.removeEventListener(e,t)}}},function(e,t,s){"use strict";Object.defineProperty(t,"__esModule",{value:!0});const r=s(1),i=60,n=e=>Math.round(6e4/e/48);class a{constructor(e){this.tick=0,this.lastTickSent=-1,this.interval=n(i),this.bpm=i,this.scheduleTicks=(()=>{let e=1,t=0;for(;e<a.DEFAULT_TICKS_TO_SCHEDULE;){const s=e*this.interval,r=this.getTick()+e;if(this.scheduledTicks.has(r));else{setTimeout(()=>{this.sendToTransport("tick"),this.incrementTick(),this.scheduledTicks.delete(r)},s);this.scheduledTicks.add(r)}e++,t+=s}}),this.timerID=0,this.scheduledTicks=new Set,this.ctx=e}onError(e){this.ctx.postMessage({event:"error",message:e})}onEvent(e){const t=e.data&&e.data.action||"error";if("error"!==t)switch(t){case"start":this.start(e.data.payload);break;case"updateInterval":this.updateInterval(e.data.payload);break;case"stop":this.stop();break;default:console.warn("Worker received unhandled action: "+t)}else this.onError(`Unsupport timing action ${t}`)}setBPM({bpm:e}){this.bpm=e,this.interval=n(e),console.log("setBPM",this.bpm,"interval",this.interval)}updateInterval({bpm:e}){this.clearScheduledTicks(),this.setBPM({bpm:e});const t=a.DEFAULT_TICK_RESOLUTION*this.interval;this.timerID=setInterval(()=>{this.scheduleTicks()},t)}start({bpm:e}){console.log("starting at BPM: ",e),this.updateInterval({bpm:e})}stop(){console.log("stopping"),this.clearScheduledTicks()}clearScheduledTicks(){this.scheduledTicks.forEach(e=>{clearTimeout(e),this.scheduledTicks.delete(e)}),clearInterval(this.timerID),this.timerID=0}incrementTick(){this.tick++}getTick(){return this.tick}sendToTransport(e,t){this.ctx.postMessage({action:e,payload:t})}}a.DEFAULT_TICK_RESOLUTION=48,a.DEFAULT_LOOKAHEAD_MS=1e3,a.DEFAULT_TICKS_TO_SCHEDULE=100,t.bindTimingWorkerOnMessageHandler=(e=>{const t=new a(e);return e=>{try{t.onEvent(e)}catch(e){t.onError(e.message)}}});class o{constructor(e={}){this.events=null,this.beat=0,this.tick=0,this.bpm=i,this.onMessage=(e=>{const t=o.EVENTS,s=e.name||e.data.action;switch(s){case"buffer":console.log("loop change detected"),this.events.emit(t.BUFFER,{adress:e.address,payload:e.data.payload});break;case"beat":this.incrementBeat(),this.events.emit(t.BEAT,e.data.payload);break;case"tick":this.incrementTick(),this.events.emit(t.TICK,e.data.payload);break;case"processLoops":this.events.emit(t.PROCESS_LOOPS,e.data.payload);break;case"updateBPM":this.updateBPM(e.data.payload.bpm),this.events.emit(t.UPDATE_BPM,e.data.payload);break;case"start":this.start(e.data.payload),this.events.emit(t.START,e.data.payload);break;case"stop":this.stop(),this.events.emit(t.STOP,e.data.payload);break;default:console.error("Unhandled transport event: ",s,e),this.stop()}}),this.events=new r.EventEmitter,this.bpm=e.bpm}getTick(){return+this.tick}getBeat(){return+this.beat}getBPM(){return+this.bpm}incrementBeat(){this.beat++}incrementTick(){this.tick++}processLoops({tick:e}){console.log("TODO: processLoops!")}sendToWorker(e,t){this.timerWorker.postMessage({action:e,payload:t})}static toEvent(e){return{name:(e.address||"").split("/")[1],data:e}}bindTimerWorkerListeners(e,t){e.onmessage=(e=>{this.onMessage(e)}),e.onerror=t}startTimerWorker(e){this.timerWorker=e,this.bindTimerWorkerListeners(this.timerWorker,e=>{console.error("Worker error: ",e.message)}),this.start({bpm:this.bpm})}start({bpm:e}){this.sendToWorker("start",{bpm:e})}stop(){this.sendToWorker("stop",{})}updateBPM(e){this.sendToWorker("updateInterval",{bpm:e})}}o.EVENTS={TICK:"TICK",BEAT:"BEAT",BUFFER:"BUFFER",PROCESS_LOOPS:"PROCESS_LOOPS",STOP:"STOP",START:"START",UPDATE_BPM:"UPDATE_BPM"},o.DEFAULT_TICK_RESOLUTION=48,o.DEFAULT_LOOKAHEAD_MS=1e3,o.DEFAULT_BPM=i,t.Transport=o,t.default=o},function(e,t,s){"use strict";Object.defineProperty(t,"__esModule",{value:!0});const r=s(2),i=self;i.onmessage=r.bindTimingWorkerOnMessageHandler(i)}]);'},function(e,t,s){"use strict";Object.defineProperty(t,"__esModule",{value:!0});t.Loop=class{constructor({handler:e,name:t}){this.isSleeping=!1,this.handler=e.bind(this),this.name=t,this.isDead=!1}sleep(e){return this.isSleeping=!0,this.tickToAwake=this.tick+e,new Promise((e,t)=>{})}destroy(){this.isDead=!0,this.handler=null}run(e){this.tick=e,this.isSleeping&&this.tick===this.tickToAwake&&(this.isSleeping=!1,this.tickToAwake=null),this.isSleeping||this.isDead||this.handler(this)}}},function(e,t,s){"use strict";Object.defineProperty(t,"__esModule",{value:!0});t.Dispatcher=class{constructor(){const e=document.createTextNode(null);this.addEventListener=e.addEventListener.bind(e),this.removeEventListener=e.removeEventListener.bind(e),this.dispatchEvent=e.dispatchEvent.bind(e)}}},function(e,t,s){"use strict";Object.defineProperty(t,"__esModule",{value:!0});const r=s(2);t.EventEmitter=class{constructor(e){this.dispatcher=e||new r.Dispatcher}on(e,t){this.dispatcher.addEventListener(e,t)}emit(e,t){const s=new CustomEvent(e,t);this.dispatcher.dispatchEvent(s)}off(e,t){this.dispatcher.removeEventListener(e,t)}}},function(e,t,s){"use strict";Object.defineProperty(t,"__esModule",{value:!0});const r=s(3),i=60,o=e=>Math.round(6e4/e/48);class n{constructor(e){this.tick=0,this.lastTickSent=-1,this.interval=o(i),this.bpm=i,this.scheduleTicks=(()=>{let e=1,t=0;for(;e<n.DEFAULT_TICKS_TO_SCHEDULE;){const s=e*this.interval,r=this.getTick()+e;if(this.scheduledTicks.has(r));else{setTimeout(()=>{this.sendToTransport("tick"),this.incrementTick(),this.scheduledTicks.delete(r)},s);this.scheduledTicks.add(r)}e++,t+=s}}),this.timerID=0,this.scheduledTicks=new Set,this.ctx=e}onError(e){this.ctx.postMessage({event:"error",message:e})}onEvent(e){const t=e.data&&e.data.action||"error";if("error"!==t)switch(t){case"start":this.start(e.data.payload);break;case"updateInterval":this.updateInterval(e.data.payload);break;case"stop":this.stop();break;default:console.warn("Worker received unhandled action: "+t)}else this.onError(`Unsupport timing action ${t}`)}setBPM({bpm:e}){this.bpm=e,this.interval=o(e),console.log("setBPM",this.bpm,"interval",this.interval)}updateInterval({bpm:e}){this.clearScheduledTicks(),this.setBPM({bpm:e});const t=n.DEFAULT_TICK_RESOLUTION*this.interval;this.timerID=setInterval(()=>{this.scheduleTicks()},t)}start({bpm:e}){console.log("starting at BPM: ",e),this.updateInterval({bpm:e})}stop(){console.log("stopping"),this.clearScheduledTicks()}clearScheduledTicks(){this.scheduledTicks.forEach(e=>{clearTimeout(e),this.scheduledTicks.delete(e)}),clearInterval(this.timerID),this.timerID=0}incrementTick(){this.tick++}getTick(){return this.tick}sendToTransport(e,t){this.ctx.postMessage({action:e,payload:t})}}n.DEFAULT_TICK_RESOLUTION=48,n.DEFAULT_LOOKAHEAD_MS=1e3,n.DEFAULT_TICKS_TO_SCHEDULE=100,t.bindTimingWorkerOnMessageHandler=(e=>{const t=new n(e);return e=>{try{t.onEvent(e)}catch(e){t.onError(e.message)}}});class a{constructor(e={}){this.events=null,this.beat=0,this.tick=0,this.bpm=i,this.onMessage=(e=>{const t=a.EVENTS,s=e.name||e.data.action;switch(s){case"buffer":console.log("loop change detected"),this.events.emit(t.BUFFER,{adress:e.address,payload:e.data.payload});break;case"beat":this.incrementBeat(),this.events.emit(t.BEAT,e.data.payload);break;case"tick":this.incrementTick(),this.events.emit(t.TICK,e.data.payload);break;case"processLoops":this.events.emit(t.PROCESS_LOOPS,e.data.payload);break;case"updateBPM":this.updateBPM(e.data.payload.bpm),this.events.emit(t.UPDATE_BPM,e.data.payload);break;case"start":this.start(e.data.payload),this.events.emit(t.START,e.data.payload);break;case"stop":this.stop(),this.events.emit(t.STOP,e.data.payload);break;default:console.error("Unhandled transport event: ",s,e),this.stop()}}),this.events=new r.EventEmitter,this.bpm=e.bpm}getTick(){return+this.tick}getBeat(){return+this.beat}getBPM(){return+this.bpm}incrementBeat(){this.beat++}incrementTick(){this.tick++}processLoops({tick:e}){console.log("TODO: processLoops!")}sendToWorker(e,t){this.timerWorker.postMessage({action:e,payload:t})}static toEvent(e){return{name:(e.address||"").split("/")[1],data:e}}bindTimerWorkerListeners(e,t){e.onmessage=(e=>{this.onMessage(e)}),e.onerror=t}startTimerWorker(e){this.timerWorker=e,this.bindTimerWorkerListeners(this.timerWorker,e=>{console.error("Worker error: ",e.message)}),this.start({bpm:this.bpm})}start({bpm:e}){this.sendToWorker("start",{bpm:e})}stop(){this.sendToWorker("stop",{})}updateBPM(e){this.sendToWorker("updateInterval",{bpm:e})}}a.EVENTS={TICK:"TICK",BEAT:"BEAT",BUFFER:"BUFFER",PROCESS_LOOPS:"PROCESS_LOOPS",STOP:"STOP",START:"START",UPDATE_BPM:"UPDATE_BPM"},a.DEFAULT_TICK_RESOLUTION=48,a.DEFAULT_LOOKAHEAD_MS=1e3,a.DEFAULT_BPM=i,t.Transport=a,t.default=a},function(e,t,s){"use strict";Object.defineProperty(t,"__esModule",{value:!0});const r=s(4),i=s(1),o=s(0),n=r.Transport.EVENTS;class a{constructor(e={}){this.lastTick=Date.now(),this.timerWorker=null,this.oscillator=null,this.lastScheduledTickTimestamp=Date.now(),this.hasStopped=!0,this.bufferQueue=[],this.newLoopsQueue=[],this.tick=0,this.beat=0,this.isFirstBeat=!0,this.loops={},this.useInlineWorker=!1,this.T=r.Transport.DEFAULT_TICK_RESOLUTION,this.M=4*r.Transport.DEFAULT_TICK_RESOLUTION,this.onTick=(e=>{const t=this.transport.getTick(),s=Date.now()-this.lastTick;this.lastTick=Date.now(),console.log("tick",t,s),this.processLoops(t),t%r.Transport.DEFAULT_TICK_RESOLUTION==0&&this.onBeat()}),this.onFirstBeat=(e=>{}),this.onBeat=(e=>{this.isFirstBeat&&(this.onFirstBeat(e),this.isFirstBeat=!1),this.drainRegisterLoopQueue()}),this.registerLoop=((e,t)=>{this.newLoopsQueue.push({name:e,handler:t})}),this.setTempo=(e=>{a.USE_SERVER_CLOCK?fetch(`http://${window.location.host}/updateBpm`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({bpm:e})}).then(e=>{console.log("BPM updated",e.json())}):this.sendToTransport("updateBPM",{bpm:e})}),this.playNote=(e=>{const t=this.context,s=t.createOscillator();s.type="sine",s.frequency.value=e,s.connect(t.destination),s.start(0),this.oscillator=s,setTimeout(()=>{this.oscillator.stop(0)},100)}),this.getOutputs=(()=>{if(!a.MIDI)return[];a.MIDI.enable(function(e){e?console.log("WebMidi could not be enabled.",e):console.log("WebMidi enabled!")})});const{useInlineWorker:t}=e;this.useInlineWorker=!!t,this.init()}init(){this.setTransport(),this.setAudioContext(),this.startClock(),this.setGlobals(window)}setTransport(){this.transport=new r.Transport({bpm:r.Transport.DEFAULT_BPM}),this.transport.events.on(n.TICK,this.onTick),this.bpm=this.transport.getBPM()}setAudioContext(e=AudioContext){this.context=new e}sendToTransport(e,t){this.transport.onMessage({data:{action:e,payload:t}})}start(){this.hasStopped&&(this.hasStopped=!1,this.startTimerWorker(),this.sendToTransport("start",{bpm:this.bpm}))}stop(){this.hasStopped||(this.hasStopped=!0,this.sendToTransport("stop"))}drainRegisterLoopQueue(){for(;this.newLoopsQueue.length>0;){const e=this.loops,{name:t,handler:s}=this.newLoopsQueue.pop();if(e[t]){e[t].destroy(),delete e[t]}e[t]=new i.Loop({name:t,handler:s})}}loadBuffer(e){const t=document.querySelectorAll(".buffer-script");Array.from(t).forEach(e=>e.remove());const s=document.createElement("script"),r=Date.now();s.src=`${e}?${r}`,s.className="buffer-script",document.body.appendChild(s)}processLoops(e){Object.keys(this.loops).forEach(t=>{console.log("processing loop",t,e),this.loops[t].run(e)})}processBuffers(){for(;this.bufferQueue.length;)this.loadBuffer(this.bufferQueue.shift())}startOSCListen(){}startTimerWorker(){this.useInlineWorker?this.transport.startTimerWorker(this.makeBlobWorker()):this.transport.startTimerWorker(new Worker(a.TIMING_WORKER_PATH))}makeBlobWorker(){if("undefined"!=typeof Blob){var e=new Blob([o],{type:"text/javascript"});return new Worker(window.URL.createObjectURL(e))}console.warn("Unable to load fallback worker.")}setupMIDI(){}startClock(){a.USE_SERVER_CLOCK||this.start(),this.startOSCListen(),this.setupMIDI()}setGlobals(e){e.loop=this.registerLoop,e.setTempo=this.setTempo,e.playNote=this.playNote,e.T=this.T,e.M=this.M,e.sqcr=this,e.BrowserClient=a}}a.Transport=r.Transport,a.EVENTS=n,a.LOOKAHEAD=r.Transport.DEFAULT_LOOKAHEAD_MS,a.USE_SERVER_CLOCK=!1,a.DEFAULT_BPM=r.Transport.DEFAULT_BPM,a.DEFAULT_LOOKAHEAD_MS=r.Transport.DEFAULT_LOOKAHEAD_MS,a.TIMING_WORKER_PATH="/lib/timing.worker.js",a.DEFAULT_TICKS_TO_SCHEDULE=100,a.currentBrowserBPM=r.Transport.DEFAULT_BPM,t.BrowserClient=a,t.default=a},function(e,t,s){"use strict";Object.defineProperty(t,"__esModule",{value:!0});const r=s(5);window.SQCR=r.BrowserClient,window.sqcr=new r.BrowserClient({useInlineWorker:!0})}]).default;