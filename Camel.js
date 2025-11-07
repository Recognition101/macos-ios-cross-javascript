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
        name: 'Camel',
        help: 'Encode/decodes between camel and snake case.',
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
            help: 'Decode (to snake) or encode (to camel) the text.'
        }]
    });

    if (!input) { return; }

    const text = string(input.text);

    if (input.decode) {
        const out = text
            .replaceAll(/[A-Z]/g, x => `_${x.toLocaleLowerCase()}`)
            .replaceAll(/\s+_*/g, '_');

        output('Camel', out ?? '');
    } else {
        const out = text
            .replaceAll(/\s+/g, '_')
            .replaceAll(/_+(\w)/g, (_, w) => string(w).toLocaleUpperCase());

        output('Camel', out ?? '');
    }
};

main();
