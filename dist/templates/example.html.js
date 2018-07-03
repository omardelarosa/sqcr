System.register([], function (exports_1, context_1) {
    "use strict";
    var exampleTemplate;
    var __moduleName = context_1 && context_1.id;
    return {
        setters: [],
        execute: function () {
            exports_1("exampleTemplate", exampleTemplate = function (locals, scripts) {
                if (locals === void 0) { locals = {}; }
                if (scripts === void 0) { scripts = []; }
                var scriptTags = scripts.map(function (sPath) { return "<script src=\"" + sPath + "\"></script>"; });
                return "\n    <!DOCTYPE html>\n    <html>\n        <head>\n            <title>sqcr</title>\n            <meta charset=\"UTF-8\" />\n            <script>\n                // BROWSER ENV VARIABLES\n                var BUFFER_PATH = '" + locals.BUFFER_PATH + "';\n                var USE_BROWSER_CLOCK = '" + locals.USE_BROWSER_CLOCK + "';\n            </script>\n            " + scriptTags.join('\n') + "\n        </head>\n        <body>\n        <pre>\n" + locals.ASCII_TEXT + "\n        </pre>\n        <div>\n            <a href=\"javascript:sqcr.start()\">start</a>\n            <a href=\"javascript:sqcr.stop()\">stop</a>\n        </div>\n        </body>\n    </html>\n";
            });
        }
    };
});
//# sourceMappingURL=example.html.js.map