import { BrowserClient } from './index';

import * as osc from 'osc';
import * as WebMidi from 'webmidi';

BrowserClient.OSC = osc;
BrowserClient.MIDI = WebMidi;
BrowserClient.USE_BROWSER_CLOCK = true;

const sqcr = new BrowserClient();

sqcr.init();
