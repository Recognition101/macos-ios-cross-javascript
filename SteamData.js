// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: cyan; icon-glyph: gamepad;
// @ts-ignore
// eslint-disable-next-line
try { require; } catch(e) { require = () => importModule('lib/scriptable'); }
const { getInput, compile } = require('./lib/node.js');

const help = `Displays all Steam User Data.

Setup: Use "SteamData Update" to download the data.`;

const main = async () => {
    const input = await getInput({ help, inScriptable: true, args: [ ] });
    if (!input) { return; }
    compile('$/steamdata');
};

main();
