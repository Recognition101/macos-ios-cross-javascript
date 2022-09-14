// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: cyan; icon-glyph: gift;
// @ts-ignore
// eslint-disable-next-line
try { require; } catch(e) { require = importModule; }

const { getInput, compile } = require('./lib/lib.js');

const help = `Displays a GUI JS-based wishlist app.

Setup: Use "Wishlist Add" to create the Wishlist JSON.
Setup: Use "Wishlist Update" to create the Sale JSON.`;

const main = async () => {
    const name = 'Wishlist';
    const input = await getInput({ name, help, inScriptable: true });
    if (!input) { return; }
    compile('$/wishlist');
};

main();
