///<reference path="../types/appLists.d.ts" />
// @ts-ignore
// eslint-disable-next-line
try { require; } catch(e) { require = importModule; }
const {
    downloadJson,
    readJson,
    writeJson,
    cacheArgStructure
} = require('./lib.js');

// # ==== Constants ====

const apiUrlApple = 'https://itunes.apple.com/lookup?id=';
const pathLists = '$/applists/lists.json';

// # ==== Script Arguments ====

const helpFootnote = `

App Lists JSON Path: ${pathLists}
App Lists JSON Type: $/types/appLists.d.ts::AppLists`;

const helpImport = `Imports a list of apps from a JSON file.${helpFootnote}`;

/**
 * Gets the arguments for the App Lists Import command.
 * @param {AppLists} listSet the existing lists
 * @return {ArgStructure} the arguments for the import command
 */
const getArgumentsImport = (listSet) => {
    const listNames = Object.keys(listSet.lists);
    return {
        name: 'App Lists Import',
        inScriptable: false,
        help: helpImport,
        args: [{
            name: 'file',
            shortName: 'f',
            share: true,
            type: 'pathFile',
            bookmarkName: 'appListsImportFile',
            help: 'The JSON file (map of id-keys) to import.'
        }, {
            name: 'list',
            shortName: 'l',
            type: 'enum',
            help: 'Which list to import the apps into.',
            choices: listNames.map(title => ({ title, code: title }))
        }]
    };
};

const helpItem = `Adds/removes an item from a particular list.${helpFootnote}`;

/**
 * Gets the arguments for the App Lists Manage command.
 * @param {AppLists} listSet the existing lists
 * @return {ArgStructure} the arguments for the item command
 */
const getArgumentsItem = (listSet) => {
    const listNames = Object.keys(listSet.lists);

    return {
        name: 'App Lists Item',
        inScriptable: false,
        help: helpItem,
        args: [{
            name: 'item',
            shortName: 'i',
            share: true,
            type: 'string',
            help: 'The URL or string containing an app ID to add/remove.'
        }, {
            name: 'action',
            shortName: 'a',
            type: 'enum',
            help: 'Whether to add or remove the item from the list.',
            choices: [
                { title: 'Add To...', code: 'add' },
                { title: 'Remove From...', code: 'remove' }
            ]
        }, {
            name: 'list',
            shortName: 'l',
            type: 'enum',
            help: 'Which list to add/remove the item from.',
            choices: listNames.map(title => ({ title, code: title }))
        }]
    };
};

const helpManage = `Creates/Deletes App Lists themselves.${helpFootnote}`;

/**
 * Gets the arguments for the App Lists Manage command.
 * @param {AppLists} listSet the existing lists
 * @return {ArgStructure} the arguments for the manage command
 */
const getArgumentsManage = (listSet) => {
    return {
        name: 'App Lists Manage',
        inScriptable: false,
        help: helpManage,
        args: [{
            name: 'action',
            shortName: 'a',
            type: 'enum',
            help: 'Whether to create a new list or remove an existing list.',
            choices: [
                { title: 'Create New List', code: 'create' },
                ...Object.keys(listSet.lists)
                    .map(name => ({ title: name, code: `remove:${name}` }))
            ]
        }, {
            name: 'name',
            shortName: 'n',
            type: 'string',
            help: 'The name of the new list to create (only used if creating).'
        }]
    };
};

const helpUpdateDates = `Updates a list's "Last Updated" dates.${helpFootnote}`;

/**
 * Gets the arguments for the App Lists Update Dates command.
 * @param {AppLists} listSet the existing lists
 * @return {ArgStructure} the arguments for the update dates command
 */
const getArgumentsUpdateDates = (listSet) => {
    const listNames = Object.keys(listSet.lists);
    return {
        name: 'App Lists Update Dates',
        inScriptable: true,
        help: helpUpdateDates,
        args: [{
            name: 'list',
            shortName: 'l',
            type: 'enum',
            help: 'Which list to update the "Last Updated" dates within.',
            choices: listNames.map(title => ({ title, code: title }))
        }]
    };
};

const helpUpdateSales = `Updates a list's app sale prices.${helpFootnote}`;

/**
 * Gets the arguments for the App Lists Update Sales command.
 * @param {AppLists} listSet the existing lists
 * @return {ArgStructure} the arguments for the update sales command
 */
const getArgumentsUpdateSales = (listSet) => {
    const listNames = Object.keys(listSet.lists);
    return {
        name: 'App Lists Update Sales',
        inScriptable: true,
        help: helpUpdateSales,
        args: [{
            name: 'list',
            shortName: 'l',
            type: 'enum',
            help: 'Which list to update the sale prices within.',
            choices: listNames.map(title => ({ title, code: title }))
        }]
    };
};

// # ==== Generic Library Functions ====

/**
 * Filters an array in place.
 * @template T the type of the array to filter
 * @param {T[]} list the array to filter
 * @param {(element: T) => boolean} predicate return true to keep the element
 */
const filterInPlace = (list, predicate) => {
    let insertIndex = 0;

    for(let testIndex = 0; testIndex < list.length; testIndex += 1) {
        const testElement = list[testIndex];
        if (predicate(testElement)) {
            list[insertIndex] = testElement;
            insertIndex += 1;
        }
    }

    list.length = insertIndex;
};

// # ==== App List Specific Library Functions ====

/**
 * Reads and returns the lists database.
 * @return {Promise<AppLists>} the lists read from disk
 */
const readLists = async () => {
    const listsJson = /** @type {AppLists|null} */(await readJson(pathLists));
    const listSet = listsJson || { lists: { }, metadata: { } };
    return listSet;
};

/**
 * Writes a list back to disk.
 * @param {AppLists} listSet the lists to write
 * @param {boolean} [didUpdateListSet] if `true`, a list was added or deleted
 */
const writeLists = async (listSet, didUpdateListSet) => {
    await writeJson(pathLists, listSet);

    if (didUpdateListSet) {
        await cacheArgStructure(getArgumentsImport(listSet));
        await cacheArgStructure(getArgumentsItem(listSet));
        await cacheArgStructure(getArgumentsManage(listSet));
        await cacheArgStructure(getArgumentsUpdateDates(listSet));
        await cacheArgStructure(getArgumentsUpdateSales(listSet));
    }
};

/**
 * Parses an ID number from a URL or title string.
 * @param {string} name the URL or title string to parse the ID from
 * @return {string} the ID or empty string if none found
 */
const parseId = name => name.match(/(?:^|id)(\d+)/)?.[1] ?? '';

/**
 * Requests App details from the web given an App ID.
 * @param {string} id the app id to get details for
 * @return {Promise<Result<AppListsMetadata>>} the metadata describing the app
 */
const getMetadata = async (id) => {
    const searchJson = await downloadJson(apiUrlApple + id);
    const search = /** @type {TunesQuery|null} */(searchJson);
    const result = search?.results[0];

    const name = result?.trackName;
    const price = result?.price ?? 0;
    const lastUpdated = result?.currentVersionReleaseDate ?? null;
    const artUrl = result?.artworkUrl512 ?? null;
    const completed = false;

    if (name) {
        return { value: { id, name, price, lastUpdated, artUrl, completed } };
    } else {
        return { error: `Could not download metadata for App ID: ${id}` };
    }
};

/**
 * Adds or removes items from a list, performing extra maintenance afterwards.
 * @typedef {Object} AppListsEditConfig
 * @prop {boolean} [ignoreRemovedApps] if true, ignore metadata download errors
 * @prop {boolean} [updateMetadata] if true, re-download metadata for added apps
 * @prop {boolean} [doRemove] if true, remove items
 *
 * @param {AppLists} listSet the set of lists to update
 * @param {string} name the name of the list to add or remove items from
 * @param {string[]} items a list of items to add or remove
 * @param {AppListsEditConfig} [config] optional configuration options
 * @return {Promise<Result<true>>} a result, `true` if succeeded
 */
const editList = async (listSet, name, items, config) => {
    const list = listSet.lists[name];
    if (!list) {
        return { error: `Could not find a list named: ${name}` };
    }

    // Remove Names From List
    const itemIds = new Set(items.map(name => parseId(name)));
    filterInPlace(list, name => !itemIds.has(parseId(name)));

    // Download missing metadata
    const addItems = config?.doRemove ? [ ] : items;
    for(const name of addItems) {
        const id = parseId(name);

        if (!listSet.metadata[id] || config?.updateMetadata) {
            const metadataResult = await getMetadata(id);
            if ('value' in metadataResult) {
                listSet.metadata[id] = metadataResult.value;
            } else if (!config?.ignoreRemovedApps) {
                return metadataResult;
            }
        }

        const metadata = listSet.metadata[id];
        list.push(metadata ? `${id}:${metadata.name}` : name);
    }

    // Trim unreferenced metadata
    const lists = Object.values(listSet.lists);
    const allIds = new Set(lists.flat().map(name => parseId(name)));
    for(const id of Object.keys(listSet.metadata)) {
        if (!allIds.has(id)) {
            delete listSet.metadata[id];
        }
    }

    // Update Human-Readable Names
    for(const list of Object.values(listSet.lists)) {
        for(let i = 0; i < list.length; i += 1) {
            const id = parseId(list[i]);
            const metadata = listSet.metadata[id];
            if (metadata) {
                list[i] = `${id}:${metadata.name} @ $${metadata.price ?? 0}`;
            }
        }
    }

    return { value: true };
};

module.exports = {
    pathLists,
    getArgumentsImport, getArgumentsItem, getArgumentsManage,
    getArgumentsUpdateDates, getArgumentsUpdateSales,
    filterInPlace,
    readLists, writeLists, parseId, getMetadata, editList
};
