// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-green; icon-glyph: sync;
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
    getRestartArgs,
    updateLifeLog
} = require('./lib/lifelog.js');


const main = async () => {
    const logJson = /** @type {LifeLog|null} */(await readJson(pathLog));
    /** @type {LifeLog} */
    const log = logJson || { activities: [], log: {}, finish: {} };

    const input = await getInput(getRestartArgs(log));

    if (!input) { return; }

    const title = string(input.activity);
    const match = log.activities.find(x => getActivityTitle(x) === title);
    const now = (new Date()).getTime();

    if (!title || !match) {
        return error('LifeLog Log',
            !title && input.activity ? 'Too many matches for that activity.' :
            !title && !input.activity ? 'No matches for that activity.' :
            !match ? 'Internal title matching issue. Investigate this.' :
            'Bad input.');
    }

    match.dateFinished = undefined;
    match.dateRecent = now;
    log.log[now] = match.id;

    await updateLifeLog(log);
    output('LifeLog Restart', 'Activity Restarted: ' + title);
};

main();
