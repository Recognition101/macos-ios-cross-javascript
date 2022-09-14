// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: blue; icon-glyph: plus; share-sheet-inputs: plain-text, url;
// @ts-ignore
// eslint-disable-next-line
try { require; } catch(e) { require = importModule; }

const { getInput, string, paste, output } = require('./lib/lib.js');

const getCommaGroups = /,(\d{3})/g;
const getNumbers = /-?\d+(\.\d+)?(e-?\d+)?/g;

const main = async () => {
    const input = await getInput({
        name: 'Sum',
        help: 'Sums a space separated list of numbers.',
        inScriptable: false,
        args: [{
            name: 'numbers',
            shortName: 'n',
            type: 'string',
            share: true,
            help: 'The list of (US-formatted) numbers.'
        }]
    });
    if (!input) { return; }

    const rawNumbers = string(input.numbers) || paste() || '';
    const noCommas = rawNumbers.replace(getCommaGroups, '$1');
    const numbers = (noCommas.match(getNumbers) || []).map(x => Number(x) || 0);

    output('Sum', numbers.reduce((sum, x) => sum + x, 0));
};

main();
