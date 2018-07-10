import { bindTimingWorker, IWorkerGlobalScope } from '../browser/Transport';

const ctx: any = <any>self;

ctx.onmessage = bindTimingWorker(ctx);

ctx.postMessage('worker online!');
