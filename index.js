const startServer = require('./src/server').startServer;

const SQCR = (input, flags) => {
    const serverPath = flags.path || process.cwd(); // Default to location process call
    const currentDir = __dirname;
    const port = flags.port;
    const buffers = input[0] || flags.buffers;
    const initFileName = flags.init || 'init.js';
    const useBrowserClock = flags.browser || false;
    startServer({
        port,
        serverPath,
        currentDir,
        buffers,
        init: initFileName,
        useBrowserClock,
    });
};

module.exports = SQCR;
