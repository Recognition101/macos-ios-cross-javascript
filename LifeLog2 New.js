// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-green; icon-glyph: bookmark;
// share-sheet-inputs: url;

///<reference path="./types/lifeLog2.d.ts" />
// @ts-ignore
// eslint-disable-next-line
try { require; } catch(e) { require = importModule; }

const { getInput, output, error, string } = require('./lib/lib.js');
const {
    pathLog, pathActivities,
    camelCaseToTitle,
    makeActivityId,
    readLog, readActivities, writeLifeLogData
} = require('./lib/lifelog2.js');

const help = `Creates a new Activity in the LifeLog Activities JSON.

LifeLog JSON Path: ${pathLog}
LifeLog JSON Type: $/types/lifeLog2.d.ts::LifeLog
LifeLog Activities JSON Path: ${pathActivities}
LifeLog Activities JSON Type: $/types/lifeLog2.d.ts::LifeLog2Activities`;

const main = async () => {
    const log = await readLog();
    const acts = await readActivities();

    /** @type {LifeLog2TypeList} */
    const types = [ 'movie', 'tv', 'book', 'game' ];
    
    const typeOptions = types.map(type => ({
        title: camelCaseToTitle(type),
        code: type
    }));

    const input = await getInput({
        name: 'LifeLog2 New',
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
            name: 'subType',
            shortName: 's',
            type: 'string',
            help: 'The activity sub-type ' +
                '(book author, movie year, game system).'
        }]
    });

    if (!input) { return; }

    const name = string(input.name);
    const type = types.find(x => input && x === input.type);
    const argSubType = string(input.subType);

    if (!name || !type || !argSubType) {
        const errorKind = !name ? 'Name' : (!type ? 'Type' : 'Sub-Type');
        return error('LifeLog New', `Invalid ${errorKind}!`);
    }

    // Write new Activity to `acts`
    const timeCreated = (new Date()).getTime();
    const subType = argSubType.replaceAll('/', '-');
    const key = `lifelog://${type}/${subType}/${name}`;
    const isOld = key in acts;

    acts[key] = acts[key] || { key, type, subType, name, timeCreated };

    // Activate new Activity in `log`
    makeActivityId(key, log);
    log.active = Array.from((new Set(log.active)).add(key));

    await writeLifeLogData(log, acts, true);

    const outVerb = isOld ? 'Reactivated' : 'Added new';
    output('LifeLog New', `${outVerb} activity: ${name}`);
};

main();
