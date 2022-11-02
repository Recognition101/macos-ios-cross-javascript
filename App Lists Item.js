// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-green; icon-glyph: mobile-alt;
// share-sheet-inputs: url;

///<reference path="./types/appLists.d.ts" />
// @ts-ignore
// eslint-disable-next-line
try { require; } catch(e) { require = importModule; }

const { getInput, output, error, string } = require('./lib/lib.js');
const {
    getArgumentsItem,
    readLists, writeLists, parseId, editList
} = require('./lib/applists.js');

const main = async () => {
    const listSet = await readLists();
    const input = await getInput(getArgumentsItem(listSet));

    if (!input) { return; }

    const item = string(input.item);
    const doRemove = string(input.action) === 'remove';
    const listName = string(input.list);
    
    const id = parseId(item);
    const metadataInit = listSet.metadata[id];
    if (!id) {
        return error('App Lists Item', `No App ID found in: ${item}`);
    }

    // Update List & Metadata
    const editResult = await editList(listSet, listName, [ item ], {
        updateMetadata: true,
        doRemove
    });
    if ('error' in editResult) {
        return error('App Lists Item', editResult.error);
    }

    await writeLists(listSet);

    // Output
    const verb = doRemove ? 'removed' : 'added';
    const metadata = listSet.metadata[id] ?? metadataInit;
    const name = metadata?.name ?? id;
    const price = metadata?.price ?? 0;
    output('App Lists Item', `${listName} ${verb}: ${name} ($${price})`);
};

main();
