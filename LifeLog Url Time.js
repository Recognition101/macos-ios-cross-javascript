// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-green; icon-glyph: calendar-plus;
// share-sheet-inputs: url;

///<reference path="./types/lifeLog.d.ts" />
// @ts-ignore
// eslint-disable-next-line
try { require; } catch(e) { require = importModule; }

const { getInput, output, error, string } = require('./lib/lib.js');
const {
    pathLog, pathActivities,
    parseTime,
    makeActivityId, getActivityTitle, getKeyFromUrl,
    readLog, readActivities, writeLifeLogData
} = require('./lib/lifelog.js');

const help = `Logs a URL-based activity at a particular time, similar to
\`LifeLog Url\`, but logs a user-provided time rather than simply "now".

LifeLog JSON Path: ${pathLog}
LifeLog JSON Type: $/types/lifeLog.d.ts::LifeLog
LifeLog Activities JSON Path: ${pathActivities}
LifeLog Activities JSON Type: $/types/lifeLog.d.ts::LifeLogActivities`;

const main = async () => {
    const log = await readLog();
    const acts = await readActivities();
    const input = await getInput({
        name: 'LifeLog URL Time',
        help,
        inScriptable: false,
        args: [{
            name: 'url',
            shortName: 'u',
            type: 'string',
            share: true,
            help: 'The URL to log.'
        }, {
            name: 'time',
            shortName: 't',
            type: 'date',
            help: 'The time the URL-log occurred.'
        }]
    });

    if (!input) { return; }

    const { key } = getKeyFromUrl(string(input.url));
    const time = parseTime(input.time);
    if (!key || !time) {
        const errorType = key ? 'URL' : 'Time';
        return error('LifeLog URL Time', `Invalid ${errorType}.`);
    }

    const id = makeActivityId(key, log);
    log.log[time] = id;

    await writeLifeLogData(log, acts);

    const title = getActivityTitle(key, acts);
    output('LifeLog URL Time', `Logged activity: ${title}`);
};

main();
