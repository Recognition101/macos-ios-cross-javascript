// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: blue; icon-glyph: arrow-right;
// share-sheet-inputs: plain-text;
// @ts-ignore
// eslint-disable-next-line
try { require; } catch(e) { require = importModule; }

const { getInput, string, output } = require('./lib/lib.js');

const main = async () => {
    const input = await getInput({
        name: 'Kebabcase',
        help: 'Converts text to kebab-case.',
        inScriptable: false,
        outputType: 'data',
        args: [{
            name: 'text',
            shortName: 't',
            type: 'string',
            share: true,
            help: 'The text to encode/decode.'
        }]
    });

    if (!input) { return; }

    const out = string(input.text)
        .replaceAll(/[A-Z]/g, (x, i) => i ? `-${x.toLocaleLowerCase()}` : x)
        .replaceAll(/[ _-]+/g, '-');

    output('Kebabcase', out ?? '');
};

main();
