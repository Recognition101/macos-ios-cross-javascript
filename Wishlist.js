// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: cyan; icon-glyph: gift;
// @ts-ignore
// eslint-disable-next-line
try { require; } catch(e) { require = () => importModule('lib/scriptable'); }

const { getInput, compile } = require('./lib/node.js');

const help = `Displays a GUI JS-based wishlist app.

Setup: Use "Wishlist Add" to create the Wishlist JSON.
Setup: Use "Wishlist Update" to create the Sale JSON.`;

const main = async () => {
    const input = await getInput({ help, inScriptable: true, args: [ ] });
    if (!input) { return; }
    compile('$/wishlist');
};

main();
