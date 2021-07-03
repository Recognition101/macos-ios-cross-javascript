// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: cyan; icon-glyph: sync-alt;
// @ts-ignore
// eslint-disable-next-line
try { require; } catch(e) { require = () => importModule('lib/scriptable'); }
const { getInput, compile } = require('./lib/node.js');

const help = `Displays all apps, sorted by date-last-updated.

Setup: Run the "AppActivity Update" script to create the Activity JSON.`;

const main = async () => {
    const input = await getInput({ help, inScriptable: true, args: [ ] });
    if (!input) { return; }
    compile('$/appactivity');
};

main();
