// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: blue; icon-glyph: equals; share-sheet-inputs: plain-text;
// @ts-ignore
// eslint-disable-next-line
try { require; } catch(e) { require = importModule; }

const { getInput, string, atob, btoa, output } = require('./lib/lib.js');

const main = async () => {

    const input = await getInput({
        name: 'Base64',
        help: 'Encodes/Decodes Base 64 data.',
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
            help: 'Decode (true) or encode (false) the text.'
        }]
    });

    if (!input) { return; }

    const text = string(input.text);
    const out = input.decode ? atob(text) : btoa(text);

    output('UrlParam', out ?? '');
};

main();
