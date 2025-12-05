// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: blue; icon-glyph: anchor; share-sheet-inputs: plain-text;
// @ts-ignore
// eslint-disable-next-line
try { require; } catch(e) { require = importModule; }

const {
    getInput,
    string,
    output,
    encodeURIComponent
} = require('./lib/lib.js');

const main = async () => {
    const input = await getInput({
        name: 'UrlParam Decode',
        help: 'Converts some URL-safe text into plain text.',
        inScriptable: false,
        outputType: 'data',
        args: [{
            name: 'text',
            shortName: 't',
            type: 'string',
            share: true,
            help: 'The text to decode.'
        }]
    });

    if (!input) { return; }
    output('UrlParam Decode', decodeURIComponent(string(input.text)) ?? '');
};

main();
