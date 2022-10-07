// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: light-brown; icon-glyph: file-alt;
// share-sheet-inputs: file-url;
// @ts-ignore
// eslint-disable-next-line
try { require; } catch(e) { require = importModule; }

const {
    string, getInput, readText, external, showHtml
} = require('./lib/lib.js');

const main = async () => {
    const input = await getInput({
        name: 'Markdown File',
        help: 'Converts a markdown file (or string) to HTML and displays it.',
        inScriptable: true,
        args: [{
            name: 'file',
            shortName: 'f',
            type: 'pathFile',
            bookmarkName: 'markdown-file',
            share: true,
            help: 'The markdown files to convert.'
        }]
    });
    if (!input) { return; }

    const file = string(input.file);
    const content = file.indexOf('\n') > -1 ? file : await readText(file);
    const markdown = content || 'Error: File Not Found';

    showHtml(external.markedTemplates.html(external.marked(markdown)));
};

main();
