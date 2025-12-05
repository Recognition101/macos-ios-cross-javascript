// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: blue; icon-glyph: barcode; share-sheet-inputs: plain-text;
// @ts-ignore
// eslint-disable-next-line
try { require; } catch(e) { require = importModule; }

const { getInput, string, output } = require('./lib/lib.js');

const pmInMs = 12 * 60 * 60 * 1000;

const main = async () => {
    const input = await getInput({
        name: 'TimeStamp',
        help: 'Gets a TimeStamp from a human-readable date.',
        inScriptable: false,
        outputType: 'data',
        args: [{
            name: 'text',
            shortName: 't',
            type: 'string',
            share: true,
            help: 'The human-readable time string.'
        }]
    });

    if (!input) { return; }

    // TODO: Fix 12 AM vs 12 PM
    const text = string(input.text).toLowerCase().trim();
    const suffixAmount = text.endsWith('pm') ? pmInMs : 0;
    const textNoSuffix = text.replace(/\s*[ap]m$/, '');
    const date = new Date(textNoSuffix);
    output('TimeStamp', (date.getTime() + suffixAmount).toString());
};

main();
