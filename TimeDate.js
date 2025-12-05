// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: blue; icon-glyph: calendar-alt;
// share-sheet-inputs: plain-text;
// @ts-ignore
// eslint-disable-next-line
try { require; } catch(e) { require = importModule; }

const { getInput, string, output, error } = require('./lib/lib.js');

const main = async () => {
    const input = await getInput({
        name: 'TimeDate',
        help: 'Gets a human readable date-time from a unix timestamp.',
        inScriptable: false,
        outputType: 'data',
        args: [{
            name: 'text',
            shortName: 't',
            type: 'string',
            share: true,
            help: 'The unix timestamp.'
        }]
    });

    if (!input) { return; }

    const inputString = string(input.text)
        .toLowerCase()
        .replace(/[^.\d]/gi, '');

    const now = new Date(parseInt(inputString));

    if (isNaN(now.getTime())) {
        return error('TimeDate', 'Bad Timestamp.');
    }

    const currentTime = now.getFullYear()
        + '-' + (now.getMonth() + 1).toString().padStart(2, '0')
        + '-' + now.getDate().toString().padStart(2, '0')
        + ' ' + ((now.getHours() % 12) || 12)
        + ':' + now.getMinutes().toString().padStart(2, '0')
        + ':' + now.getSeconds().toString().padStart(2, '0')
        + ' ' + (now.getHours() > 11 ? 'PM' : 'AM');

    output('TimeDate', currentTime);
};

main();
