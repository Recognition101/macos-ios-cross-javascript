// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: blue; icon-glyph: equals; share-sheet-inputs: plain-text;
// @ts-ignore
// eslint-disable-next-line
try { require; } catch(e) { require = importModule; }

const { getInput, string, atob, btoa, output } = require('./lib/lib.js');

const main = async () => {
    const input = await getInput({
        name: 'B64 Decode',
        help: 'Decodes Base64 into plain text.',
        inScriptable: false,
        outputType: 'data',
        args: [{
            name: 'text',
            shortName: 't',
            type: 'string',
            share: true,
            help: 'The Base64 string to decode.'
        }]
    });

    if (!input) { return; }
    output('B64 Decode', atob(string(input.text)) ?? '');
};

main();
