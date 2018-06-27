// Edit this file while running the server to update loops in real time

// Resets pulse to start loops together
pulse = 0;

loop('pulse', async (ctx) => {
    pulse++;
    ctx.sleep(T/4)
});

loop('synth', async (ctx) => {
    let i = pulse % 4;

    playNote(notes[i])

    ctx.sleep(T/4);
});
