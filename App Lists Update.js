// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// always-run-in-app: true; icon-color: yellow;
// icon-glyph: layer-group;

///<reference path="./types/appLists.d.ts" />
// @ts-ignore
// eslint-disable-next-line
try { require; } catch(e) { require = importModule; }

const {
    getInput, string,
    status, output, log, error, wait
} = require('./lib/lib.js');

const {
    getArgumentsUpdate,
    readLists, writeLists, parseId, getMetadata
} = require('./lib/applists.js');

const previewUrl = 'https://apps.apple.com/us/app/';

const main = async () => {
    const listSet = await readLists();
    const input = await getInput(getArgumentsUpdate(listSet));

    if (!input) { return; }

    const listName = string(input.list);
    const list = listSet.lists[listName];

    if (!list) {
        return error('App Lists Update', 'No list found to update.');
    }

    /** @type {AppListsMetadata[]} */
    const items = [ ];

    /** @type {AppListsMetadata[]} */
    const newlyDelisted = [ ];

    for(const [i, item] of list.entries()) {
        status(`Updating: ${i} / ${list.length}`);
        const id = parseId(item);
        const metadata = listSet.metadata[id];
        const isActive = metadata && !metadata.isDelisted;

        /** @type {Result<AppListsMetadata>} */
        let result = { error: 'First Try' };
        for(let i = 0; i < 5 && isActive && result.error; i += 1) {
            if (i !== 0) { await wait(100); }
            result = await getMetadata(id);
        }

        if (metadata && !metadata.isDelisted && result && result.error) {
            newlyDelisted.push(metadata);
        }

        if (metadata && result && result.value) {
            items.push(metadata);

            const price = result.value.price;
            metadata.name = result.value.name;
            metadata.artUrl = result.value.artUrl;
            metadata.lastUpdated = result.value.lastUpdated;
            metadata.salePrice = price < metadata.price ? price : undefined;
        }
    }

    await writeLists(listSet);

    status(`Updated: ${list.length} / ${list.length}`);

    for(const item of newlyDelisted) {
        log(`Warning: ${item.name} @ ${item.price} may be delisted.`);
    }
    for(const item of items) {
        const { id, name, price, salePrice } = item;
        if (salePrice !== undefined) {
            log(`${price} -> ${salePrice}: ${name} (${previewUrl}id${id})`);
        }
    }
    output('App Lists Update', `Items Updated In: ${listName}`);
};

main();
