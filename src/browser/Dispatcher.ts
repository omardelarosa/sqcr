/** Custom event dispatcher  **/
export class Dispatcher extends Node {
    constructor() {
        super();
        // TODO: do this without a DOM using EventEmitter
        const target = document.createTextNode(null);

        this.addEventListener = target.addEventListener.bind(target);
        this.removeEventListener = target.removeEventListener.bind(target);
        this.dispatchEvent = target.dispatchEvent.bind(target);

        // Other constructor stuff...
    }
}
