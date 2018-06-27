const startServer = require('./src/server');

const SQCR = (input, flags) => {
    const serverPath = flags.path || __dirname;
    const currentDir = __dirname;
    const port = flags.port;
    const buffers = input[0] || flags.buffers;

    startServer({ port, serverPath, currentDir, buffers });
};

module.exports = SQCR;
