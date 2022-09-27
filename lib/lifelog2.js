///<reference path="../types/lifeLog2.d.ts" />
// @ts-ignore
// eslint-disable-next-line
try { require; } catch(e) { require = importModule; }
const {
    readJson, writeJson, cacheArgStructure,
    encodeURIComponent
} = require('./lib.js');

const pathLog = '$/lifelog2/lifeLog.json';
const pathActivities = '$/lifelog2/lifeLogActivities.json';
const pathSteamConfig = '$/steamdata/steam-config.json';

/**
 * Converts a name from camel case into a title.
 * @param {string} name the camel case name (ex: "gameSteamOnly")
 * @return {string} the title (ex: "Game (Steam Only)")
 */
const camelCaseToTitle = name => 
    name.charAt(0).toUpperCase() +
    name.substring(1).replace(/([A-Z])/g, ' $1').replace(/ (.+)$/, ' ($1)');

/**
 * Gets a query parameter string based on a map of parameters.
 * @param {ObjectMap<string>} params the key-value map to encode
 * @return {string} the encoded query parameters
 */
const getParamString = params =>
    Object.entries(params)
        .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
        .join('&');

/**
 * Creates an ID in the log for a given activity key (if none already exists).
 * Note: this writes to the log, so be sure to use `writeLifeLogData` after.
 * @param {string} key the activity key to get
 * @param {LifeLog2} log the log to get the ID within
 * @return {number} the ID representing the activity
 */
const makeActivityId = (key, log) => {
    const id = log.idMap[key];

    if (typeof id !== 'number') {
        const currentId = log.nextId;
        log.idMap[key] = currentId;
        log.nextId = currentId + 1;
        return currentId;
    }

    return id;
};

/**
 * Gets the human-readable title of an activity with a given key (if possible).
 * @param {string} key the activity key to get a title for
 * @param {LifeLog2Activities} acts the activity metadata
 * @return {string} the human-readable (insofar as is possible) title
 */
const getActivityTitle = (key, acts) => {
    const activity = acts[key];
    if (activity) {
        const { name, subType, type } = activity;
        return `${name} (${subType}) (${camelCaseToTitle(type)})`;
    }
    return key;
};

/**
 * Gets a map activity IDs to their minimum and maximum times.
 * @param {LifeLog2} log the log containing all activity to read
 * @return {Map<number, LifeLog2Bounds>} the map of IDs to time bounds
 */
const getActivityTimeBounds = (log) => {
    /** @type {Map<number, LifeLog2Bounds>} */
    const bounds = new Map();
    for(const timeMap of [ log.log, log.finish ]) {
        for(const [timestampString, id] of Object.entries(timeMap)) {
            const timestamp = Number(timestampString);
            const bound = bounds.get(id) ?? { min: timestamp, max: timestamp };
            bound.min = Math.min(bound.min, timestamp);
            bound.max = Math.max(bound.max, timestamp);
            bounds.set(id, bound);
        }
    }

    return bounds;
};

/**
 * Given an activity URL (iTunes, Pico8, Steam) get an activity key.
 * @param {string} url the activity URL to convert
 * @return {LifeLog2UrlKey} the key (normalized URL)
 */
const getKeyFromUrl = (url) => {
    const tunesMatcher = new RegExp(
        '^https?://(?:[^/]+\\.)*apps\\.apple\\.com' + // apps.apple.com domain
        '(?:/[^/]+)*/app(?:/[^/]+)*' + // has "app" folder anywhere in the path
        '/id(\\d+)' // extract iTunes ID
    );
    const tunesMatch = url.match(tunesMatcher);
    if (tunesMatch) {
        const urlId = tunesMatch[1];
        const key = `https://apps.apple.com/us/app/id${urlId}`;
        return { key, urlType: 'apple', urlId };
    }

    const picoMatcher = new RegExp(
        '^https?://(?:[^/]+\\.)*lexaloffle\\.com' + // lexaloffle.com domain
        '.*pid=(\\d+)' // extract BBS Pico8-ID
    );
    const picoMatch = url.match(picoMatcher);
    if (picoMatch) {
        const urlId = picoMatch[1];
        const key = `https://www.lexaloffle.com/bbs/?pid=${urlId}`;
        return { key, urlType: 'pico8', urlId };
    }

    const steamMatcher = new RegExp(
        '^https?://(?:[^/]+\\.)*steampowered\\.com' + // steampowered.com domain
        '(?:/[^/]+)*/app/(\\d+)' // extract app/<id>
    );
    const steamMatch = url.match(steamMatcher);
    if (steamMatch) {
        const urlId = steamMatch[1];
        const key = `https://store.steampowered.com/app/${urlId}`;
        return { key, urlType: 'steam', urlId };
    }

    return { key: url };
};

/**
 * Gets a list of the most recently updated activities.
 * Note: In certain corner cases this may write to `log`.
 * @param {LifeLog2} log the log containing all events to read/write
 * @param {LifeLog2Activities} acts the activity metadata
 * @param {boolean} [isAll=false] if `true`, include non-active activities
 * @return {LifeLog2ActivitySummary[]} a list of the activities
 */
const getRecentActivities = (log, acts, isAll=false) => {
    const actKeys = isAll ? Object.keys(log.idMap) : log.active;

    const bounds = getActivityTimeBounds(log);

    const summaries = actKeys.map(key => {
        const id = makeActivityId(key, log);
        const timeCreated = acts[key]?.timeCreated ?? 0;
        const time = Math.max(bounds.get(id)?.max ?? 0, timeCreated);
        return { key, title: getActivityTitle(key, acts), time };
    });

    return summaries.sort((a, b) => b.time - a.time);
};

const helpLog = `Logs an activity created by the \`LifeLog New\` script.

LifeLog JSON Path: ${pathLog}
LifeLog JSON Type: $/types/lifeLog2.d.ts::LifeLog
LifeLog Activities JSON Path: ${pathActivities}
LifeLog Activities JSON Type: $/types/lifeLog2.d.ts::LifeLog2Activities`;

/**
 * Gets the arguments for the `LifeLog Log` script.
 * @param {LifeLog2} log the log of events
 * @param {LifeLog2Activities} acts the activity metadata
 * @return {ArgStructure} the arguments for the script
 */
const getArgumentsLog = (log, acts) => {
    const recent = getRecentActivities(log, acts);

    return {
        name: 'LifeLog2 Log',
        help: helpLog,
        inScriptable: false,
        args: [{
            name: 'activity',
            shortName: 'a',
            type: 'enum',
            help: 'The unique key for the activity.',
            choices: recent.map(act => ({ title: act.title, code: act.key }))
        }, {
            name: 'time',
            shortName: 't',
            type: 'date',
            help: 'The time the activity was started.'
        }]
    };
};

const helpStop = `Stops an activity created by the \`LifeLog New\`, optionally
logging it as "finished".


LifeLog JSON Path: ${pathLog}
LifeLog JSON Type: $/types/lifeLog2.d.ts::LifeLog
LifeLog Activities JSON Path: ${pathActivities}
LifeLog Activities JSON Type: $/types/lifeLog2.d.ts::LifeLog2Activities`;

/**
 * Gets the arguments for the `LifeLog Stop` script.
 * @param {LifeLog2} log the log of events
 * @param {LifeLog2Activities} acts the activity metadata
 * @return {ArgStructure} the arguments for the script
 */
const getArgumentsStop = (log, acts) => {
    const recent = getRecentActivities(log, acts);

    return {
        name: 'LifeLog2 Stop',
        help: helpStop,
        inScriptable: false,
        args: [{
            name: 'activity',
            shortName: 'a',
            type: 'enum',
            help: 'The unique key for the activity.',
            choices: recent.map(act => ({ title: act.title, code: act.key }))
        }, {
            name: 'time',
            shortName: 't',
            type: 'date',
            help: 'The time it was finished (ignored if `finish` is false).'
        }, {
            name: 'finish',
            shortName: 'f',
            type: 'boolean',
            help: 'If true, mark the activity as finished.'
        }]
    };
};

/**
 * Gets the LifeLog events from the file system.
 * @return {Promise<LifeLog2>} the log from the file system
 */
const readLog = async () => {
    const logJson = /** @type {LifeLog2|null} */(await readJson(pathLog));
    /** @type {LifeLog2} */
    const log = logJson || {
        nextId: 1,
        idMap: { },
        active: [ ],
        log: { },
        finish: { }
    };
    return log;
};

/**
 * Gets the LifeLog activity metadata from the file system.
 * @return {Promise<LifeLog2Activities>} the activities from the file system
 */
const readActivities = async () => {
    const actsJson = /** @type {LifeLog2Activities|null} */(
        await readJson(pathActivities)
    );
    /** @type {LifeLog2Activities} */
    const acts = actsJson || { };
    return acts;
};

/**
 * Writes a modified LifeLog and (optionally) activity metadata to disk.
 * @param {LifeLog2} log the log of events to write. If null, do not write.
 * @param {LifeLog2Activities} acts the activity metadata to optionally write
 * @param {boolean} [writeActs=false] if true, also write the activity metadata
 */
const writeLifeLogData = async (log, acts, writeActs) => {
    await writeJson(pathLog, log);

    if (writeActs) {
        await writeJson(pathActivities, acts);
    }
    
    await cacheArgStructure(getArgumentsLog(log, acts));
    await cacheArgStructure(getArgumentsStop(log, acts));
};

module.exports = {
    // Constants
    pathLog, pathActivities, pathSteamConfig,
    // Non-LifeLog Specific Helpers
    camelCaseToTitle, getParamString,
    // Activities
    makeActivityId, getActivityTitle, getActivityTimeBounds,
    getKeyFromUrl, getRecentActivities,
    // Arguments
    getArgumentsLog, getArgumentsStop,
    // State
    readLog, readActivities, writeLifeLogData
};
