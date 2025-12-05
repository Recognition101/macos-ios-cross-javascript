// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: blue; icon-glyph: angle-double-up;
// share-sheet-inputs: plain-text;
// @ts-ignore
// eslint-disable-next-line
try { require; } catch(e) { require = importModule; }

const { getInput, string, output } = require('./lib/lib.js');

const main = async () => {
    const input = await getInput({
        name: 'Uppercase',
        help: 'Converts given text into all-uppercase.',
        inScriptable: false,
        outputType: 'data',
        args: [{
            name: 'text',
            shortName: 't',
            type: 'string',
            share: true,
            help: 'The text to make uppercase.'
        }]
    });

    if (!input) { return; }
    output('Uppercase', string(input.text).toLocaleUpperCase() ?? '');
};

main();
