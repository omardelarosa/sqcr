const exampleTemplate = (locals = {}, scripts = []) => {
    const scriptTags = scripts.map(sPath => `<script src="${sPath}"></script>`);

    return `
    <!DOCTYPE html>
    <html>
        <head>
            <title>sqcr</title>
            <meta charset="UTF-8" />
            <script>
                // BROWSER ENV VARIABLES
                var BUFFER_PATH = '${locals.BUFFER_PATH}';
                var USE_BROWSER_CLOCK = '${locals.USE_BROWSER_CLOCK}';
            </script>
            ${scriptTags.join('\n')}
        </head>
        <body>
        <pre>
${locals.ASCII_TEXT}
        </pre>
        </body>
    </html>
`;
};

module.exports = exampleTemplate;
