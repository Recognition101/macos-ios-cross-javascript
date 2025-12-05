// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: blue; icon-glyph: chart-bar; share-sheet-inputs: plain-text;
// @ts-ignore
// eslint-disable-next-line
try { require; } catch(e) { require = importModule; }

const { getInput, string, output } = require('./lib/lib.js');

const main = async () => {
    const input = await getInput({
        name: 'Camelcase',
        help: 'Converts text to CamelCase.',
        inScriptable: false,
        outputType: 'data',
        args: [{
            name: 'text',
            shortName: 't',
            type: 'string',
            share: true,
            help: 'The text to convert.'
        }]
    });

    if (!input) { return; }


    const out = string(input.text)
        .replaceAll(/[ _-]+(\w)/g, (_, w) => string(w).toLocaleUpperCase());

    output('Camelcase', out ?? '');
};

main();
