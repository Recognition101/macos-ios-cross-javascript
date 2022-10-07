// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-green; icon-glyph: stop-circle;

///<reference path="./types/lifeLog.d.ts" />
// @ts-ignore
// eslint-disable-next-line
try { require; } catch(e) { require = importModule; }

const { getInput, output, error, string } = require('./lib/lib.js');
const {
    parseTime,
    getActivityTitle,
    getArgumentsStop,
    readLog, readActivities, writeLifeLogData,
} = require('./lib/lifelog.js');

const main = async () => {
    const log = await readLog();
    const acts = await readActivities();
    const input = await getInput(getArgumentsStop(log, acts));

    if (!input) { return; }

    const key = string(input.activity);
    const time = parseTime(input.time);
    const isFinished = !!input.finish;
    const id = log.idMap[key];

    if ((isFinished && !time) || typeof id !== 'number') {
        return error('LifeLog Stop', `Invalid ${time ? 'activity' : 'time'}!`);
    }

    if (isFinished) {
        log.finish[time] = id;
    }

    const active = new Set(log.active);
    active.delete(key);
    log.active = Array.from(active);

    await writeLifeLogData(log, acts);

    const stopVerb = isFinished ? 'Finished' : 'Stopped';
    const title = getActivityTitle(key, acts);
    output('LifeLog Stop', `${stopVerb} activity: ${title}`);
};

main();
