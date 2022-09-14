// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-green; icon-glyph: pencil-alt;
// share-sheet-inputs: url;

///<reference path="./types/lifeLog.d.ts" />
// @ts-ignore
// eslint-disable-next-line
try { require; } catch(e) { require = importModule; }

const {
    getInput, readJson, writeJson, output, error, string
} = require('./lib/lib.js');

/**
 * Converts a name from camel case into a title.
 * @param {string} name the camel case name (ex: "gameSteamOnly")
 * @return {string} the title (ex: "Game (Steam Only)")
 */
const camelCaseToTitle = name => 
    name.charAt(0).toUpperCase() +
    name.substring(1).replace(/([A-Z])/g, ' $1').replace(/ (.+)$/, ' ($1)');

/**
 * Gets a title (human-readable ID) of an activity for choosing
 * @param {LifeLogActivity} activity the activity to get a title for
 * @return {string} the title of the activity
 */
const getActivityTitle = activity =>
    `${activity.name} (${camelCaseToTitle(activity.type)})`;

const pathLog = '$/lifelog/lifeLog.json';

const help = `Logs the start of an existing activity in the LifeLog JSON.

Setup: Use the "LifeLog New" script to create a LifeLog Activity (and JSON).

LifeLog JSON Path: ${pathLog}
LifeLog JSON Type: $/types/lifeLog.d.ts::LifeLog`;

const main = async () => {
    const logJson = /** @type {LifeLog|null} */(await readJson(pathLog));
    /** @type {LifeLog} */
    const log = logJson || { activities: [], log: {}, finish: {} };

    const activities = log.activities
        .filter(a => !a.dateFinished)
        .sort((a, b) => b.dateRecent - a.dateRecent);

    const activityTitles = activities.map(x => getActivityTitle(x));

    const input = await getInput({
        name: 'LifeLog Log',
        help,
        inScriptable: false,
        args: [{
            name: 'activity',
            shortName: 'a',
            type: 'enum',
            help: 'The title of the activity.',
            choices: activityTitles.map(title => ({ title, code: title }))
        }, {
            name: 'time',
            shortName: 't',
            type: 'date',
            help: 'The time the activity was started.'
        }]
    });

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

    await writeJson(pathLog, log);
    output('LifeLog Log', 'Activity Started: ' + title);
};

main();
