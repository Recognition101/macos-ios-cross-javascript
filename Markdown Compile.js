// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: light-brown; icon-glyph: file-download;
// share-sheet-inputs: plain-text, url;
// @ts-ignore
// eslint-disable-next-line
try { require; } catch(e) { require = () => importModule('lib/scriptable'); }

const {
    string, getInput, readText, writeText, external, output
} = require('./lib/node.js');

const pathOut = '$/markdown/output.html';
const help = `Converts a markdown file (or string) to HTML and saves it.

Output File Path: ${pathOut}`;

const main = async () => {
    const input = await getInput({
        help,
        inScriptable: false,
        args: [{
            name: 'file',
            shortName: 'f',
            type: 'pathFile',
            bookmarkName: 'markdown-file',
            share: true,
            help: 'The markdown file to convert.'
        }]
    });
    if (!input) { return; }

    const file = string(input.file);
    const content = file.indexOf('\n') > -1 ? file : await readText(file);
    const markdown = content || 'Error: File Not Found';

    await writeText(
        pathOut,
        external.markedTemplates.html(external.marked(markdown))
    );
    output('Markdown Compile', 'Compiled to $/markdown/output.html.');
};

main();
