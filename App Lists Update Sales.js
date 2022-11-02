// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// always-run-in-app: true; icon-color: yellow;
// icon-glyph: dollar-sign;

///<reference path="./types/appLists.d.ts" />
// @ts-ignore
// eslint-disable-next-line
try { require; } catch(e) { require = importModule; }

const {
    getInput, string,
    status, output, log, error
} = require('./lib/lib.js');

const {
    getArgumentsUpdateSales,
    readLists, writeLists, parseId, getMetadata
} = require('./lib/applists.js');

const previewUrl = 'https://apps.apple.com/us/app/';

const main = async () => {
    const listSet = await readLists();
    const input = await getInput(getArgumentsUpdateSales(listSet));

    if (!input) { return; }

    const listName = string(input.list);
    const list = listSet.lists[listName];

    if (!list) {
        return error('App Lists Update Sales', 'No list found to update.');
    }

    /** @type {AppListsMetadata[]} */
    const saleItems = [ ];
    for(const [i, item] of list.entries()) {
        status(`Updating: ${i} / ${list.length}`);
        const id = parseId(item);
        const metadata = listSet.metadata[id];
        if (metadata) {
            const result = await getMetadata(id);
            if ('error' in result) {
                return error('App Lists Update Sales', result.error);
            }
            if (result.value.price < metadata.price) {
                metadata.salePrice = result.value.price;
                saleItems.push(metadata);
            } else {
                delete metadata.salePrice;
            }
        }
    }

    await writeLists(listSet);

    status(`Updated: ${list.length} / ${list.length}`);
    for(const item of saleItems) {
        const { id, name, price, salePrice } = item;
        log(`${price} -> ${salePrice}: ${name} (${previewUrl}id${id})`);
    }
    output('App Lists Update Sales', `Sale Prices Updated In: ${listName}`);
};

main();
