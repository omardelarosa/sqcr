System.register([], function (exports_1, context_1) {
    "use strict";
    var Loop;
    var __moduleName = context_1 && context_1.id;
    return {
        setters: [],
        execute: function () {
            Loop = (function () {
                function Loop(_a) {
                    var handler = _a.handler, name = _a.name;
                    this.isSleeping = false;
                    this.ticksToSleep = -1;
                    this.lastTickCalled = -1;
                    this.handler = handler;
                    this.name = name;
                    this.isDead = false;
                }
                Loop.prototype.sleep = function (amount) {
                    this.ticksToSleep = amount;
                    this.isSleeping = true;
                    return new Promise(function (resolve, reject) { });
                };
                Loop.prototype.destroy = function () {
                    this.isDead = true;
                    this.handler = null;
                };
                Loop.prototype.run = function (t) {
                    this.tick = t;
                    this.ticksToSleep--;
                    if (this.ticksToSleep <= 0) {
                        this.isSleeping = false;
                    }
                    if (!this.isSleeping && !this.isDead && this.lastTickCalled !== t) {
                        this.lastTickCalled = t;
                        this.handler(this);
                    }
                };
                return Loop;
            }());
            exports_1("Loop", Loop);
        }
    };
});
//# sourceMappingURL=Loop.js.map