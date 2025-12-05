// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: blue; icon-glyph: route; share-sheet-inputs: plain-text;
// @ts-ignore
// eslint-disable-next-line
try { require; } catch(e) { require = importModule; }

const { getInput, string, output } = require('./lib/lib.js');

const main = async () => {
    const input = await getInput({
        name: 'Snakecase',
        help: 'Converts text to snake_case.',
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
        .replaceAll(/[A-Z]/g, (x, i) => i ? `_${x.toLocaleLowerCase()}` : x)
        .replaceAll(/[ _-]+/g, '_');

    output('Snakecase', out ?? '');
};

main();
