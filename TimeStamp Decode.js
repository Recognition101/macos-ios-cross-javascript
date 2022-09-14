// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: blue; icon-glyph: clock; share-sheet-inputs: plain-text, url;
// @ts-ignore
// eslint-disable-next-line
try { require; } catch(e) { require = importModule; }

const { getInput, string, output, error } = require('./lib/lib.js');

const minuteMs = 1000 * 60;
const dayMs = minuteMs * 60 * 24;
const tzOffsetMs = (new Date()).getTimezoneOffset() * minuteMs;

const main = async () => {

    const input = await getInput({
        name: 'TimeStamp Decode',
        help: 'Converts a unix epoch timestamp (ms) to a human time.',
        inScriptable: false,
        args: [{
            name: 'time',
            shortName: 't',
            type: 'string',
            share: true,
            help: 'The unix epoch timestamp (in milliseconds).'
        }]
    });

    if (!input) { return; }

    const inputString = string(input && input.time)
        .toLowerCase()
        .replace(/[^.\d]/gi, '');

    const now = new Date(parseInt(inputString));

    if (isNaN(now.getTime())) {
        return error('TimeStamp Decode', 'Bad Timestamp.');
    }

    const currentTime = now.getFullYear()
        + '-' + (now.getMonth() + 1).toString().padStart(2, '0')
        + '-' + now.getDate().toString().padStart(2, '0')
        + ' ' + ((now.getHours() % 12) || 12)
        + ':' + now.getMinutes().toString().padStart(2, '0')
        + ':' + now.getSeconds().toString().padStart(2, '0')
        + ' ' + (now.getHours() > 11 ? 'PM' : 'AM');

    output('TimeStamp Decode', currentTime);
};

main();
