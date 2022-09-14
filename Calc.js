// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// always-run-in-app: true; icon-color: cyan;
// icon-glyph: calculator;
// @ts-ignore
// eslint-disable-next-line
try { require; } catch(e) { require = importModule; }
const { getInput, compile } = require('./lib/lib.js');

const help = 'Displays a GUI JS-based calculator app.';

const main = async () => {
    const name = 'Calc';
    const input = await getInput({ name, help, inScriptable: true });
    if (!input) { return; }
    compile('$/calc');
};

main();
