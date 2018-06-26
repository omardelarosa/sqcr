const exampleTemplate = (OSC_BROWSER_SCRIPT, BROWSER_SCRIPT) =>
    `
    <!DOCTYPE html>
    <html>
        <head>
            <title>SQCR EXAMPLE PAGE</title>
            <meta charset="UTF-8" />
            <script src="https://cdn.jsdelivr.net/npm/webmidi"></script>
            <script>${OSC_BROWSER_SCRIPT}</script>
            <script>${BROWSER_SCRIPT}</script>
        </head>

        <body>
        </body>
    </html>
`;

module.exports = exampleTemplate;
