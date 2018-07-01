const exampleTemplate = (
    OSC_BROWSER_SCRIPT,
    BROWSER_SCRIPT,
    TONAL_BROWSER_SCRIPT,
    BUFFER_PATH,
    INIT_FILE_NAME,
    USE_BROWSER_CLOCK,
) =>
    `
    <!DOCTYPE html>
    <html>
        <head>
            <title>SQCR EXAMPLE PAGE</title>
            <meta charset="UTF-8" />
            <script src="https://cdn.jsdelivr.net/npm/webmidi"></script>
            <script>
                // BROWSER ENV VARIABLES
                var BUFFER_PATH = '${BUFFER_PATH}';
                var USE_BROWSER_CLOCK = '${USE_BROWSER_CLOCK}';
            </script>
            <script>${OSC_BROWSER_SCRIPT}</script>
            <script>${BROWSER_SCRIPT}</script>
            <script>${TONAL_BROWSER_SCRIPT}</script>
            <script async src="${INIT_FILE_NAME}"></script>
        </head>

        <body>
        </body>
    </html>
`;

module.exports = exampleTemplate;
