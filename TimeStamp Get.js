// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: blue; icon-glyph: clock; share-sheet-inputs: plain-text, url;
// @ts-ignore
// eslint-disable-next-line
try { require; } catch(e) { require = importModule; }

const { getInput, string, output } = require('./lib/lib.js');

const main = async () => {
    const now = new Date();
    const currentTime = now.getFullYear()
        + '-' + (now.getMonth() + 1).toString().padStart(2, '0')
        + '-' + now.getDate().toString().padStart(2, '0')
        + ' ' + ((now.getHours() % 12) || 12)
        + ':' + now.getMinutes().toString().padStart(2, '0')
        + ':' + now.getSeconds().toString().padStart(2, '0')
        + ' ' + (now.getHours() > 11 ? 'PM' : 'AM');

    const input = await getInput({
        name: 'TimeStamp Get',
        help: 'Gets a Unix epoch timestamp from a human readable value.',
        inScriptable: false,
        args: [{
            name: 'time',
            shortName: 't',
            type: 'string',
            share: true,
            help: 'Time in YYYY-MM-DD-HH:MM:SS format. An "AM"\n' +
                'or "PM" suffix can be added (default: PM).\n'  +
                'Current Time: ' + currentTime
        }]
    });

    if (!input) { return; }

    const inputString = string(input && input.time).toLowerCase().trim();
    const tokens = inputString.split(/[^\d]+/);

    const yearShort = parseInt(tokens[0]) || 0;
    const yearPrefix = yearShort < 50 ? 2000 : (yearShort < 100 ? 1900 : 0);
    const year = yearPrefix + yearShort;
    const month = (parseInt(tokens[1]) - 1) || 0;
    const day = (parseInt(tokens[2])) || 0;
    const hour12 = (parseInt(tokens[3])) || 12;
    const hour24 = (hour12 % 12) + (inputString.endsWith('am') ? 0 : 12);
    const minute = (parseInt(tokens[4])) || 0;
    const second = (parseInt(tokens[5])) || 0;

    const inputDate = new Date(year, month, day, hour24, minute, second);
    const inputTime = inputDate.getTime();

    output('TimeStamp Get', inputTime);
};

main();
