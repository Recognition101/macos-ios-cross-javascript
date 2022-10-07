// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: purple; icon-glyph: socks;
// @ts-ignore
// eslint-disable-next-line
try { require; } catch(e) { require = importModule; }

const { getInput, string, output } = require('./lib/lib.js');

const minuteMs = 1000 * 60;
const hourMs = minuteMs * 60;
const halfHourMs = hourMs / 2;
const dayMs = hourMs * 24;

const defaultHour = 8;
const defaultDuration = 76;

/**
 * Converts an argument into a date.
 * @param {string|boolean} arg the argument to convert
 * @return {Date} the argument, converted into a date
 */
const date = arg => string(arg)
    ? new Date(Number(string(arg)) || string(arg))
    : new Date();

const main = async () => {
    const input = await getInput({
        name: 'Laundry Delay',
        help: 'Calculates the laundry delay to input when doing laundry.',
        inScriptable: false,
        args: [{
            name: 'start',
            shortName: 's',
            type: 'date',
            help: 'The time to start the machine (default: now)'
        }, {
            name: 'end',
            shortName: 'e',
            type: 'date',
            help: `The time to end (default: ${defaultHour} AM the next day)`
        }, {
            name: 'duration',
            shortName: 'd',
            type: 'string',
            help: `The wash duration (minutes, default: ${defaultDuration})`
        }]
    });
    if (!input) { return; }

    const start = date(input.start);
    const end = date(input.end);
    const durationMinutes = Number(string(input.duration)) || defaultDuration;
    const durationMs = durationMinutes * minuteMs;

    const defaultOffset = start.getHours() >= defaultHour ? dayMs : 0;
    const endDefault = new Date(start.getTime() + defaultOffset);
    endDefault.setHours(8, 0, 0, 0);

    const endWithDefault = end.getTime() > start.getTime() ? end : endDefault;

    const delta = endWithDefault.getTime() - start.getTime() - durationMs;
    const deltaRounded = Math.floor(delta / halfHourMs) * halfHourMs;
    const finish = new Date(start.getTime() + deltaRounded + durationMs);

    output(
        'Laundry Delay',
        `${deltaRounded / hourMs} hours (Done: ${finish.toLocaleString()})`
    );
};

main();
