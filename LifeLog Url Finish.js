// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-green; icon-glyph: flag-checkered;
// share-sheet-inputs: url;

///<reference path="./types/lifeLog.d.ts" />
// @ts-ignore
// eslint-disable-next-line
try { require; } catch(e) { require = importModule; }

const { getInput, output, error, string } = require('./lib/lib.js');
const {
    pathLog, pathActivities,
    makeActivityId, getActivityTitle, getKeyFromUrl,
    readLog, readActivities, writeLifeLogData
} = require('./lib/lifelog.js');

const help = `Marks a particular URL-based activity as finished.

LifeLog JSON Path: ${pathLog}
LifeLog JSON Type: $/types/lifeLog.d.ts::LifeLog
LifeLog Activities JSON Path: ${pathActivities}
LifeLog Activities JSON Type: $/types/lifeLog.d.ts::LifeLogActivities`;

const main = async () => {
    const log = await readLog();
    const acts = await readActivities();
    const input = await getInput({
        name: 'LifeLog URL Finish',
        help,
        inScriptable: false,
        args: [{
            name: 'url',
            shortName: 'u',
            type: 'string',
            share: true,
            help: 'The URL to finish.'
        }]
    });

    if (!input) { return; }

    const { key } = getKeyFromUrl(string(input.url));
    if (!key) {
        return error('LifeLog URL Finish', 'Invalid URL.');
    }

    const time = (new Date()).getTime();
    const id = makeActivityId(key, log);
    log.finish[time] = id;

    await writeLifeLogData(log, acts);

    const title = getActivityTitle(key, acts);
    output('LifeLog URL Finish', `Finished activity: ${title}`);
};

main();
