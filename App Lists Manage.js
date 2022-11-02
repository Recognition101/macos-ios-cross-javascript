// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-green; icon-glyph: screwdriver;

///<reference path="./types/appLists.d.ts" />
// @ts-ignore
// eslint-disable-next-line
try { require; } catch(e) { require = importModule; }

const { getInput, output, error, string } = require('./lib/lib.js');
const {
    getArgumentsManage,
    readLists, writeLists
} = require('./lib/applists.js');


const main = async () => {
    const listSet = await readLists();
    const input = await getInput(getArgumentsManage(listSet));

    if (!input) { return; }

    const action = string(input.action);
    const name = action === 'create'
        ? string(input.name)
        : action.slice(action.indexOf(':') + 1);

    if (action === 'create') {
        if (!name) {
            return error('App Lists Manage', 'No name provided for new list.');
        }

        listSet.lists[name] = [ ];

    } else {
        if (!name || !listSet.lists[name]) {
            return error('App Lists Manage', 'No list found to remove.');
        }

        delete listSet.lists[name];
    }

    await writeLists(listSet, true);

    const method = action === 'create' ? 'created' : 'removed';
    output('App Lists Manage', `List ${method}: ${name}`);
};

main();
