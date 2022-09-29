// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-green; icon-glyph: pencil-alt;
// share-sheet-inputs: url;

///<reference path="./types/lifeLog.d.ts" />
// @ts-ignore
// eslint-disable-next-line
try { require; } catch(e) { require = importModule; }

const { getInput, output, error, string } = require('./lib/lib.js');
const {
    parseTime,
    getActivityTitle,
    getArgumentsLog,
    readLog, readActivities, writeLifeLogData,
} = require('./lib/lifelog.js');

const main = async () => {
    const log = await readLog();
    const acts = await readActivities();
    const input = await getInput(getArgumentsLog(log, acts));

    if (!input) { return; }

    const key = string(input.activity);
    const time = parseTime(input.time);
    const id = log.idMap[key];

    if (!time || typeof id !== 'number') {
        return error('LifeLog Log', `Invalid ${time ? 'activity' : 'time'}!`);
    }

    log.log[time] = id;

    await writeLifeLogData(log, acts);

    output('LifeLog Log', `Logged activity: ${getActivityTitle(key, acts)}`);
};

main();
