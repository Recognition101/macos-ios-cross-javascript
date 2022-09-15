///<reference path="../types/lib.d.ts" />
// @ts-ignore
// eslint-disable-next-line
try { require; } catch(e) { require = importModule; }

const { writeJson, cacheArgStructure } = require('./lib.js');

const pathLog = '$/lifelog/lifeLog.json';

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

// LifeLog Finish

const helpFinish = '' +
`Logs an existing activity as completed now in the LifeLog JSON.

Setup: Use the "LifeLog New" script to create a LifeLog Activity (and JSON).

LifeLog JSON Path: ${pathLog}
LifeLog JSON Type: $/types/lifeLog.d.ts::LifeLog`;

/**
 * Gets the ArgStructure for the LifeLog Finish script.
 * @param {LifeLog} log the current state of the life log
 * @return {ArgStructure} the argument structure for the script
 */
const getFinishArgs = (log) => {
    const activities = log.activities
        .filter(a => !a.dateFinished)
        .sort((a, b) => b.dateRecent - a.dateRecent);

    const activityTitles = activities.map(x => getActivityTitle(x));

    return {
        name: 'LifeLog Finish',
        help: helpFinish,
        inScriptable: false,
        args: [{
            name: 'activity',
            shortName: 'a',
            type: 'enum',
            help: 'The title of the activity.',
            choices: activityTitles.map(title => ({ title, code: title }))
        }]
    };
};

// LifeLog Log


const helpLog = `Logs the start of an existing activity in the LifeLog JSON.

Setup: Use the "LifeLog New" script to create a LifeLog Activity (and JSON).

LifeLog JSON Path: ${pathLog}
LifeLog JSON Type: $/types/lifeLog.d.ts::LifeLog`;

/**
 * Gets the ArgStructure for the LifeLog Log script.
 * @param {LifeLog} log the current state of the life log
 * @return {ArgStructure} the argument structure for the script
 */
const getLogArgs = (log) => {
    const activities = log.activities
        .filter(a => !a.dateFinished)
        .sort((a, b) => b.dateRecent - a.dateRecent);

    const activityTitles = activities.map(x => getActivityTitle(x));

    return {
        name: 'LifeLog Log',
        help: helpLog,
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
    };
};

// LifeLog Restart

const helpRestart = `Restarts an existing (ended) Activity in the LifeLog JSON.

Setup: Use the "LifeLog New" script to create a LifeLog Activity (and JSON).

LifeLog JSON Path: ${pathLog}
LifeLog JSON Type: $/types/lifeLog.d.ts::LifeLog`;

/**
 * Gets the ArgStructure for the LifeLog Restart script.
 * @param {LifeLog} log the current state of the life log
 * @return {ArgStructure} the argument structure for the script
 */
const getRestartArgs = (log) => {
    const activities = log.activities
        .filter(a => Boolean(a.dateFinished))
        .sort((a, b) => b.dateRecent - a.dateRecent);

    const activityTitles = activities.map(x => getActivityTitle(x));

    return {
        name: 'LifeLog Restart',
        help: helpRestart,
        inScriptable: false,
        args: [{
            name: 'activity',
            shortName: 'a',
            type: 'enum',
            help: 'The title of the activity.',
            choices: activityTitles.map(title => ({ title, code: title }))
        }]
    };
};

/**
 * Updates the LifeLog JSON data file and all other files that depend on it.
 * @param {LifeLog} log the new state of the life log to save
 * @return {Promise<void>} a promise resolving once the new data is sved
 */
const updateLifeLog = async (log) => {
    await writeJson(pathLog, log);
    await cacheArgStructure(getFinishArgs(log));
    await cacheArgStructure(getLogArgs(log));
    await cacheArgStructure(getRestartArgs(log));
};

module.exports = {
    pathLog,
    camelCaseToTitle,
    getActivityTitle,
    getFinishArgs,
    getLogArgs,
    getRestartArgs,
    updateLifeLog
};
