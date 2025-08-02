// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-green; icon-glyph: external-link-alt;
// share-sheet-inputs: url;

///<reference path="./types/lifeLog.d.ts" />
// @ts-ignore
// eslint-disable-next-line
try { require; } catch(e) { require = importModule; }

const { getInput, output, error, string } = require('./lib/lib.js');
const {
    pathLog, pathActivities,
    getActivityTitle, getKeyFromUrl,
    readLog, readActivities, writeLifeLogData
} = require('./lib/lifelog.js');

const help = `Activates a URL based activity, allowing its use
by "Lifelog Log.js".

LifeLog JSON Path: ${pathLog}
LifeLog JSON Type: $/types/lifeLog.d.ts::LifeLog
LifeLog Activities JSON Path: ${pathActivities}
LifeLog Activities JSON Type: $/types/lifeLog.d.ts::LifeLogActivities`;

const main = async () => {
    const log = await readLog();
    const acts = await readActivities();
    const input = await getInput({
        name: 'LifeLog URL Start',
        help,
        inScriptable: false,
        args: [{
            name: 'url',
            shortName: 'u',
            type: 'string',
            share: true,
            help: 'The URL to activate.'
        }]
    });

    if (!input) { return; }

    const { key } = getKeyFromUrl(string(input.url));
    if (!key) {
        return error('LifeLog URL Start', 'Invalid URL.');
    }

    log.active = Array.from((new Set(log.active)).add(key));

    await writeLifeLogData(log, acts);

    const title = getActivityTitle(key, acts);
    output('LifeLog URL Start', `Started activity: ${title}`);
};

main();
