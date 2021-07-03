// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-green; icon-glyph: flag-checkered;
// share-sheet-inputs: url;

///<reference path="./types/lifeLog.d.ts" />
// @ts-ignore
// eslint-disable-next-line
try { require; } catch(e) { require = () => importModule('lib/scriptable'); }

const {
    getInput, readJson, writeJson, output, error, string
} = require('./lib/node.js');

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

const help = `Logs an existing activity as completed now in the LifeLog JSON.

Setup: Use the "LifeLog New" script to create a LifeLog Activity (and JSON).

LifeLog JSON Path: ${pathLog}
LifeLog JSON Type: $/types/lifeLog.d.ts::LifeLog`;

const main = async () => {

    /** @type {LifeLog|null} */
    const logJson = (await readJson(pathLog));
    /** @type {LifeLog} */
    const log = logJson || { activities: [], log: {}, finish: {} };

    const activities = log.activities
        .filter(a => !a.dateFinished)
        .sort((a, b) => b.dateRecent - a.dateRecent);

    const activityTitles = activities.map(x => getActivityTitle(x));

    const input = await getInput({
        help,
        inScriptable: false,
        args: [{
            name: 'activity',
            shortName: 'a',
            type: 'enum',
            help: 'The title of the activity.',
            choices: activityTitles.map(title => ({ title, code: title }))
        }]
    });

    if (!input) { return; }

    const title = string(input.activity);
    const now = (new Date()).getTime();
    const match = log.activities.find(x => getActivityTitle(x) === title);

    if (!title || !match) {
        return error('LifeLog Log',
            !title && input.activity ? 'Too many matches for that activity.' :
            !title && !input.activity ? 'No matches for that activity.' :
            !match ? 'getInput returned bad enum value (Internal Error).' :
            'Bad input.');
    }

    match.dateRecent = now;
    match.dateFinished = now;
    log.finish[now] = match.id;

    await writeJson(pathLog, log);
    output('LifeLog Finish', 'Activity finished: ' + title);
};

main();
