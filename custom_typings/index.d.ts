// Type definitions for scqr
// Project: sqcr
// Definitions by: omar delarosa (https://omardelarosa.com)
import * as _osc from 'osc';

export declare global {
    // Defined in the global template file
    interface Window {
        sqcr: any;
    }
    const osc: typeof _osc;
}
