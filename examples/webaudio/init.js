setTempo(100);

// Make an array of notes
notes = ['C4', 'E4', 'G4', 'C5', 'G5', 'E5'].map(Tonal.Note.freq);

// Define loops once
bufferQueue.push(`${BUFFER_PATH}/loops.js`);
