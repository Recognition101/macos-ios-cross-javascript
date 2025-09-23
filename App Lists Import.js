// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: light-brown; icon-glyph: file-import;
// share-sheet-inputs: file-url;

///<reference path="./types/appLists.d.ts" />
// @ts-ignore
// eslint-disable-next-line
try { require; } catch(e) { require = importModule; }

const { getInput, string, readJson, output, error } = require('./lib/lib.js');
const {
    getArgumentsImport,
    readLists, writeLists, parseId, editList
} = require('./lib/applists.js');


const main = async () => {
    const listSet = await readLists();
    const input = await getInput(getArgumentsImport(listSet));

    if (!input) { return; }

    const listName = string(input.list);
    const importFileJson = await readJson(string(input.file));
    const importFile = /** @type {AppListsImport|null} */(importFileJson);

    const names = Object.entries(importFile ?? { }).map(([ name, app ]) =>
        `${parseId(name)}:${app?.name ?? name}`
    );
    const editResult = await editList(listSet, listName, names, {
        ignoreRemovedApps: true
    });
    if (!importFile) {
        return error('App Lists Import', 'File invalid/not found.');
    }
    if (editResult.error) {
        error('App Lists Import', editResult.error);
    }

    await writeLists(listSet);

    output('App Lists Import', `Imported JSON.`);
};

main();
