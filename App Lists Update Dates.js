// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// always-run-in-app: true; icon-color: yellow;
// icon-glyph: sync-alt;

///<reference path="./types/appLists.d.ts" />
// @ts-ignore
// eslint-disable-next-line
try { require; } catch(e) { require = importModule; }

const { getInput, status, output, error, string } = require('./lib/lib.js');
const {
    getArgumentsUpdateDates,
    readLists, writeLists, parseId, getMetadata
} = require('./lib/applists.js');

const main = async () => {
    const listSet = await readLists();
    const input = await getInput(getArgumentsUpdateDates(listSet));

    if (!input) { return; }

    const listName = string(input.list);
    const list = listSet.lists[listName];

    if (!list) {
        return error('App Lists Update Dates', 'No list found.');
    }

    for(const [i, item] of list.entries()) {
        status(`Updating: ${i} / ${list.length}`);
        const id = parseId(item);
        const metadata = listSet.metadata[id];
        if (metadata) {
            const result = await getMetadata(id);
            if ('error' in result) {
                return error('App Lists Update Dates', result.error);
            }
            metadata.lastUpdated = result.value.lastUpdated;
        }
    }

    await writeLists(listSet);

    status(`Updated: ${list.length} / ${list.length}`);
    output('App Lists Update Dates', `Dates Updated In: ${listName}`);
};

main();
