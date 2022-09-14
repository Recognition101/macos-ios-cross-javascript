// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: cyan; icon-glyph: sync-alt;
// @ts-ignore
// eslint-disable-next-line
try { require; } catch(e) { require = importModule; }
const { getInput, compile } = require('./lib/lib.js');

const help = `Displays all apps, sorted by date-last-updated.

Setup: Run the "AppActivity Update" script to create the Activity JSON.`;

const main = async () => {
    const name = 'AppActivity';
    const input = await getInput({ name, help, inScriptable: true });
    if (!input) { return; }
    compile('$/appactivity');
};

main();
