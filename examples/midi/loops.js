// Edit this file while running the server to update loops in real time

// Resets pulse to start loops together
pulse = 0;

loop('pulse', async (ctx) => {
    pulse++;
    ctx.sleep(T/4)
});

loop('synth', async (ctx) => {
    let i = pulse % 4;

    SYNTH().playNote(notes[i], 1, { velocity: 0.3 })
        .stopNote(notes[i], 1, { time: '+100' })

    ctx.sleep(T/4);
});

loop('kicks', async (ctx) => {
    if (!kicks[pulse % 16]) return ctx.sleep(T/4);

    // Play kick beat
    TR().playNote(36, 1, { velocity: 0.9 })
        .stopNote(36, 1, { time: '+100' })

    ctx.sleep(T/4);
});

loop('hats', async (ctx) => {
    if (!hats[pulse % 16]) return ctx.sleep(T/4);

    TR().playNote(42, 1, { velocity: 0.4 })
        .stopNote(42, 1, { time: '+100' });
    
    ctx.sleep(T/4);
});

loop('snares', async (ctx) => {
    if (!snares[pulse % 16]) return ctx.sleep(T/4);

    TR().playNote(38, 1, { velocity: 0.4 })
        .stopNote(38, 1, { time: '+100' });
    
    ctx.sleep(T/4);
});
