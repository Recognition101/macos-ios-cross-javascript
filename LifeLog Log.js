// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-green; icon-glyph: pencil-alt;
// share-sheet-inputs: url;

///<reference path="./types/lifeLog.d.ts" />
// @ts-ignore
// eslint-disable-next-line
try { require; } catch(e) { require = importModule; }

const {
    getInput, readJson, output, error, string
} = require('./lib/lib.js');

const {
    pathLog,
    getActivityTitle,
    getLogArgs,
    updateLifeLog
} = require('./lib/lifelog.js');


const main = async () => {
    const logJson = /** @type {LifeLog|null} */(await readJson(pathLog));
    /** @type {LifeLog} */
    const log = logJson || { activities: [], log: {}, finish: {} };

    const input = await getInput(getLogArgs(log));

    if (!input) { return; }

    const title = string(input.activity);
    const timeString = string(input.time);
    const match = log.activities.find(x => getActivityTitle(x) === title);

    if (!title || !match) {
        return error('LifeLog Log',
            !title && input.activity ? 'Too many matches for that activity.' :
            !title && !input.activity ? 'No matches for that activity.' :
            !match ? 'getInput returned bad enum value (Internal Error).' :
            'Bad input.');
    }

    const time = timeString && /^\d+$/.test(timeString)
        ? parseInt(timeString, 10)
        : Date.parse(timeString) || Date.now();

    match.dateRecent = Math.max(match.dateRecent, time);
    log.log[time] = match.id;

    await updateLifeLog(log);
    output('LifeLog Log', 'Activity Started: ' + title);
};

main();
