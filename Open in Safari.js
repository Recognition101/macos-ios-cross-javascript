// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-blue; icon-glyph: compass;
// share-sheet-inputs: url, plain-text;
// @ts-ignore
// eslint-disable-next-line
try { require; } catch(e) { require = importModule; }

const { getInput, string, open, paste } = require('./lib/lib.js');

const main = async () => {
    const input = await getInput({
        name: 'Open in Safari',
        help: 'Opens a page in Safari.',
        inScriptable: true,
        args: [{
            name: 'url',
            shortName: 'u',
            type: 'string',
            share: true,
            help: 'The page to open in safari.'
        }]
    });
    if (!input) { return; }

    open(string(input.url) || paste());
};

main();
