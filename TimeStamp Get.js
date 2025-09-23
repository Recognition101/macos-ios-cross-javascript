// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: purple; icon-glyph: clock;
// @ts-ignore
// eslint-disable-next-line
try { require; } catch(e) { require = importModule; }

const { getInput, string, output } = require('./lib/lib.js');

const main = async () => {
    const input = await getInput({
        name: 'TimeStamp Get',
        help: 'Gets a Unix epoch timestamp from a human readable value.',
        inScriptable: false,
        outputType: 'data',
        args: [{
            name: 'time',
            shortName: 't',
            type: 'date',
            help: 'The time to get as a timestamp.'
        }]
    });

    if (!input) { return; }
    const time = string(input.time);
    const timeInput = /^-?\d+$/.test(time) ? Number(time) : time;
    output('TimeStamp Get', (new Date(timeInput)).getTime());
};

main();
