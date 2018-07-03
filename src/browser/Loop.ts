export class Loop {
    public handler: (ctx: Loop) => void;
    public name: string;

    private isSleeping: boolean = false;
    private tick: number;
    private isDead: boolean;
    private ticksToSleep: number = -1;
    private lastTickCalled: number = -1;

    constructor({ handler, name }) {
        this.handler = handler;
        this.name = name;
        this.isDead = false;
    }

    public sleep(amount): Promise<any> {
        this.ticksToSleep = amount;
        this.isSleeping = true;
        return new Promise((resolve, reject) => {});
    }

    destroy() {
        this.isDead = true;
        this.handler = null;
    }

    run(t: number): void {
        this.tick = t;
        // Decrementer must be at the begging to account for 0th tick in sleep cycle
        this.ticksToSleep--;
        if (this.ticksToSleep <= 0) {
            this.isSleeping = false;
        }

        // Only call if not sleeping, not dead and has not been called this tick
        if (!this.isSleeping && !this.isDead && this.lastTickCalled !== t) {
            this.lastTickCalled = t;
            this.handler(this);
        }
    }
}
