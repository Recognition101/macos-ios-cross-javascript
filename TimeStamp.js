// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: blue; icon-glyph: barcode; share-sheet-inputs: plain-text;
// @ts-ignore
// eslint-disable-next-line
try { require; } catch(e) { require = importModule; }

const { getInput, string, output, error } = require('./lib/lib.js');

const months = Object.freeze(/** @type {const} */([
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December' 
]));

const pmInMs = 12 * 60 * 60 * 1000;

const main = async () => {

    const input = await getInput({
        name: 'TimeStamp',
        help: 'Encodes/decodes a unix timestamp as something human-readable.',
        inScriptable: false,
        outputType: 'data',
        args: [{
            name: 'text',
            shortName: 't',
            type: 'string',
            share: true,
            help: 'The unix timestamp or human-readable time string.'
        }, {
            name: 'decode',
            shortName: 'd',
            type: 'boolean',
            help: 'Decode (true) a timestamp or encode (false) text.'
        }]
    });

    if (!input) { return; }

    if (input.decode) {
        const inputString = string(input.text)
            .toLowerCase()
            .replace(/[^.\d]/gi, '');

        const now = new Date(parseInt(inputString));

        if (isNaN(now.getTime())) {
            return error('TimeStamp', 'Bad Timestamp.');
        }

        const currentTime = now.getFullYear()
            + '-' + (now.getMonth() + 1).toString().padStart(2, '0')
            + '-' + now.getDate().toString().padStart(2, '0')
            + ' ' + ((now.getHours() % 12) || 12)
            + ':' + now.getMinutes().toString().padStart(2, '0')
            + ':' + now.getSeconds().toString().padStart(2, '0')
            + ' ' + (now.getHours() > 11 ? 'PM' : 'AM');

        output('TimeStamp', currentTime);
        
    } else {
        // TODO: Fix 12 AM vs 12 PM
        const text = string(input.text).toLowerCase().trim();
        const suffixAmount = text.endsWith('pm') ? pmInMs : 0;
        const textNoSuffix = text.replace(/\s*[ap]m$/, '');
        const date = new Date(textNoSuffix);
        output('TimeStamp', (date.getTime() + suffixAmount).toString());
    }
};

main();
