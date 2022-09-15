// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-green; icon-glyph: pencil-alt;
// share-sheet-inputs: url;

///<reference path="./types/lifeLog.d.ts" />
// @ts-ignore
// eslint-disable-next-line
try { require; } catch(e) { require = importModule; }

const {
    getInput, readJson, output, error, string, downloadJson
} = require('./lib/lib.js');

const {
    pathLog,
    getActivityTitle,
    updateLifeLog
} = require('./lib/lifelog.js');

/**
 * Gets an iTunes ID given an iTunes URL.
 * @param {string?} [url] the iTunes URL to get an ID from
 * @return {string|null} the iTunes ID, if one could be found.
 */
const getItunesId = url => {
    const idMatch = url && url.match(/\/id(\d+)/);
    return (idMatch && idMatch[1]) || null;
};

/**
 * @param {string} appId the iTunes ID number to create an activity for
 * @param {LifeLog} log the lifelog we are adding the activity to
 * @return {Promise<LifeLogActivity|null>} the app activity (possibly new)
 */
const getAppActivity = async (appId, log) => {
    const searchJson = await downloadJson(iTunesUrl + appId);
    const search = /** @type {TunesQuery|null} */(searchJson);
    const app = search && search.results[0];

    if (app) {
        const now = (new Date()).getTime();
        /** @type {LifeLogActivity} */
        const activity = {
            id: log.activities.reduce((max, a) => Math.max(max, a.id + 1), 0),
            name: app.trackName,
            type: 'gameApple',
            url: appUrl + appId,
            dateCreated: now,
            dateRecent: now
        };
        log.activities.push(activity);
        return activity;
    }

    return null;
};

const iTunesUrl = 'https://itunes.apple.com/lookup?id=';
const appUrl = 'https://apps.apple.com/us/app/id';

const help = `Logs the start of an iOS app as an activity in the LifeLog JSON.
If the activity does not yet exist, it will be created.

LifeLog JSON Path: ${pathLog}
LifeLog JSON Type: $/types/lifeLog.d.ts::LifeLog`;

const main = async () => {
    const input = await getInput({
        name: 'LifeLog Log-New iOS',
        help,
        inScriptable: false,
        args: [{
            name: 'url',
            shortName: 'u',
            type: 'string',
            share: true,
            help: 'The iTunes URL of the app (ending with an ID number).'
        }]
    });

    if (!input) { return; }

    const logJson = /** @type {LifeLog|null} */(await readJson(pathLog));
    /** @type {LifeLog} */
    const log = logJson || { activities: [], log: {}, finish: {} };
    const appId = getItunesId(string(input && input.url));
    const now = (new Date()).getTime();

    if (!appId) {
        return error('LifeLog Log', 'Not an iTunes URL (No App ID).');
    }

    const oldActivity = log.activities.find(x => getItunesId(x.url) === appId);
    const activity = oldActivity || (await getAppActivity(appId, log));

    if (!activity) {
        const message = 'Could not look up iTunes App with ID: ' + appId;
        return error('LifeLog Log-New iOS', message);
    }

    activity.dateRecent = now;
    log.log[now] = activity.id;
    await updateLifeLog(log);

    const title = getActivityTitle(activity);
    output('LifeLog Log-New iOS', oldActivity
        ? `Activity Started: ${title}`
        : `Activity Created and Started: ${title}`);
};

main();
