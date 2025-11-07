// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: blue; icon-glyph: text-height;
// share-sheet-inputs: plain-text;
// @ts-ignore
// eslint-disable-next-line
try { require; } catch(e) { require = importModule; }

const { getInput, string, output } = require('./lib/lib.js');

const main = async () => {

    const input = await getInput({
        name: 'Upper',
        help: 'Changes the case of some text.',
        inScriptable: false,
        outputType: 'data',
        args: [{
            name: 'text',
            shortName: 't',
            type: 'string',
            share: true,
            help: 'The text to encode/decode.'
        }, {
            name: 'decode',
            shortName: 'd',
            type: 'boolean',
            help: 'Decode (to lowercase) or encode (to uppercase) the text.'
        }]
    });

    if (!input) { return; }

    const text = string(input.text);
    const out = input.decode
        ? text.toLocaleLowerCase()
        : text.toLocaleUpperCase();

    output('Upper', out ?? '');
};

main();
