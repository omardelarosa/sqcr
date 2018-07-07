interface TemplateLocals {
    BUFFER_PATH?: string;
    USE_SERVER_CLOCK?: boolean;
    ASCII_TEXT?: string;
}

type ScriptPaths = string[];

export const exampleTemplate = (
    locals: TemplateLocals = {},
    scripts: ScriptPaths = [],
) => {
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
                var USE_SERVER_CLOCK = '${locals.USE_SERVER_CLOCK}';
            </script>
            ${scriptTags.join('\n')}
        </head>
        <body>
        <pre>
${locals.ASCII_TEXT}
        </pre>
        <div>
            <a href="javascript:sqcr.start()">start</a>
            <a href="javascript:sqcr.stop()">stop</a>
        </div>
        </body>
    </html>
`;
};
