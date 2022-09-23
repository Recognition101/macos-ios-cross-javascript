// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-green; icon-glyph: bookmark;
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
    camelCaseToTitle,
    getActivityTitle,
    updateLifeLog
} = require('./lib/lifelog.js');

/**
 * Gets an ID to match based on an activity.
 * @param {string} title the title of the activity to get a hash for
 * @return {string} the hashed ID
 */
const getActivityId = title => title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[^-_\w]/g, '');

const help = `Creates a new Activity in the LifeLog JSON.
The JSON file itself will be created if it does not exist.

LifeLog JSON Path: ${pathLog}
LifeLog JSON Type: $/types/lifeLog.d.ts::LifeLog`;

const main = async () => {
    const logJson = /** @type {LifeLog|null} */(await readJson(pathLog));
    /** @type {LifeLog} */
    const log = logJson || { activities: [], log: {}, finish: {} };

    /** @type {LifeLogTypeList} */
    const types = [
        'movie', 'tv', 'project', 'book',
        'gamePc', 'gameApple', 'gameNintendo', 'gamePico8'
    ];

    const typeOptions = types.map(type => ({
        title: camelCaseToTitle(type),
        code: type
    }));

    const input = await getInput({
        name: 'LifeLog New',
        help,
        inScriptable: false,
        args: [{
            name: 'name',
            shortName: 'n',
            type: 'string',
            help: 'The name of the activity.'
        }, {
            name: 'type',
            shortName: 't',
            type: 'enum',
            choices: typeOptions,
            help: 'The type of activity.'
        }, {
            name: 'url',
            shortName: 'u',
            type: 'string',
            help: 'A URL to the activity\'s home page.'
        }]
    });

    if (!input) { return; }

    const name = string(input.name);
    const url = string(input.url) || undefined;
    const type = types.find(x => input && x === input.type);

    if (!name || !type) {
        return error('LifeLog New', `Invalid ${!name ? 'Name' : 'Type'}`);
    }

    const id = log.activities.reduce((max, a) => Math.max(max, a.id + 1), 0);
    const now = (new Date()).getTime();
    const dateCreated = now;
    const dateRecent = now;

    /** @type {LifeLogActivity} */
    const newActivity = { id, name, type, url, dateCreated, dateRecent };
    const newTitle = getActivityTitle(newActivity);
    const newId = getActivityId(newTitle);

    const oldActivity = log.activities.find(
        act => getActivityId(getActivityTitle(act)) === newId);

    if (oldActivity) {
        return error('LifeLog New',
            'Activity already exists: ' + getActivityTitle(oldActivity));
    }

    log.activities.push(newActivity);
    await updateLifeLog(log);
    output('LifeLog New', 'Added new activity: ' + newTitle);
};

main();
