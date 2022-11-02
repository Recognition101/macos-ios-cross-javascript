// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// always-run-in-app: true; icon-color: cyan;
// icon-glyph: list-ul;
// @ts-ignore
// eslint-disable-next-line
try { require; } catch(e) { require = importModule; }

const { getInput, compile } = require('./lib/lib.js');

const help = `Displays a GUI JS-based iOS App-List app.

Setup: Use "App Lists Manage" to create an App List JSON.
Setup: Use "App Lists Item" to add items to an App List.`;

const main = async () => {
    const name = 'App Lists';
    const input = await getInput({ name, help, inScriptable: true });
    if (!input) { return; }
    compile('$/applists');
};

main();
