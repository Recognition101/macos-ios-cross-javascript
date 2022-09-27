// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-green; icon-glyph: bookmark;
// share-sheet-inputs: url;

///<reference path="./types/lifeLog2.d.ts" />
// @ts-ignore
// eslint-disable-next-line
try { require; } catch(e) { require = importModule; }

const { getInput, output, error, string } = require('./lib/lib.js');
const {
    pathLog, pathActivities,
    makeActivityId, getActivityTitle, getKeyFromUrl,
    readLog, readActivities, writeLifeLogData
} = require('./lib/lifelog2.js');

const help = `Logs a URL-based activity, ex:
 - An iTunes App
 - A Pico8 Game
 - A Steam Game

LifeLog JSON Path: ${pathLog}
LifeLog JSON Type: $/types/lifeLog2.d.ts::LifeLog
LifeLog Activities JSON Path: ${pathActivities}
LifeLog Activities JSON Type: $/types/lifeLog2.d.ts::LifeLog2Activities`;

const main = async () => {
    const log = await readLog();
    const acts = await readActivities();
    const input = await getInput({
        name: 'LifeLog2 URL',
        help,
        inScriptable: false,
        args: [{
            name: 'url',
            shortName: 'u',
            type: 'string',
            share: true,
            help: 'The URL to log.'
        }]
    });

    if (!input) { return; }

    const { key } = getKeyFromUrl(string(input.url));
    if (!key) {
        return error('LifeLog URL', 'Invalid URL.');
    }

    const time = (new Date()).getTime();
    const id = makeActivityId(key, log);
    log.log[time] = id;

    await writeLifeLogData(log, acts);

    const title = getActivityTitle(key, acts);
    output('LifeLog URL', `Logged activity: ${title}`);
};

main();
