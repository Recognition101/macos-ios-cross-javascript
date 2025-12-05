// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: blue; icon-glyph: equals; share-sheet-inputs: plain-text;
// @ts-ignore
// eslint-disable-next-line
try { require; } catch(e) { require = importModule; }

const { getInput, string, atob, btoa, output } = require('./lib/lib.js');

const main = async () => {
    const input = await getInput({
        name: 'B64',
        help: 'Encodes text as Base64.',
        inScriptable: false,
        outputType: 'data',
        args: [{
            name: 'text',
            shortName: 't',
            type: 'string',
            share: true,
            help: 'The text to convert to Base64.'
        }]
    });

    if (!input) { return; }
    output('B64', btoa(string(input.text)) ?? '');
};

main();
