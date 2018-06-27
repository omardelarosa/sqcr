const exampleTemplate = (
    OSC_BROWSER_SCRIPT,
    BROWSER_SCRIPT,
    TONAL_BROWSER_SCRIPT,
    BUFFER_PATH,
    INIT_FILE_NAME
    ) =>
    `
    <!DOCTYPE html>
    <html>
        <head>
            <title>SQCR EXAMPLE PAGE</title>
            <meta charset="UTF-8" />
            <script src="https://cdn.jsdelivr.net/npm/webmidi"></script>
            <script>${OSC_BROWSER_SCRIPT}</script>
            <script>${BROWSER_SCRIPT}</script>
            <script>${TONAL_BROWSER_SCRIPT}</script>
            <script>
                var BUFFER_PATH = '${BUFFER_PATH}';
            </script>
            <script async src="${INIT_FILE_NAME}"></script>
        </head>

        <body>
        </body>
    </html>
`;

module.exports = exampleTemplate;
