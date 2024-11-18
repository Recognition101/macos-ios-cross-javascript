// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: blue; icon-glyph: tag;
// @ts-ignore
// eslint-disable-next-line
try { require; } catch(e) { require = importModule; }

const { getInput, string, error, output } = require('./lib/lib.js');

const getCommaGroups = /,(\d{3})/g;
const getNumbers = /-?\d+(\.\d+)?(e-?\d+)?/g;

/**
 * Converts an argument representing a list of numbers into its sum.
 * @param {string|boolean} arg the argument to calculate
 * @return {number} the sum
 */
const toSummed = (arg) => {
    const rawNumbers = string(arg);
    const noCommas = rawNumbers.replace(getCommaGroups, '$1');
    const numbers = (noCommas.match(getNumbers) || []).map(x => Number(x) || 0);
    return numbers.reduce((sum, x) => sum + x, 0);
};

const main = async () => {
    const input = await getInput({
        name: 'Bill Split',
        help: 'Splits a bill, handling extras like tip and tax.',
        inScriptable: false,
        args: [{
            name: 'yours',
            shortName: 'y',
            type: 'string',
            help: 'The (pre-tip/tax) amount you purchased (space-delimited values will be summed).'
        }, {
            name: 'total',
            shortName: 't',
            type: 'string',
            help: 'The (pre-tip/tax) total.'
        }, {
            name: 'extra',
            shortName: 'x',
            type: 'string',
            help: 'The shared tip/tax etc to add (space-delimited values will be summed).'
        }]
    });
    if (!input) { return; }

    const yours = toSummed(input.yours);
    const total = toSummed(input.total);
    const extra = toSummed(input.extra);

    const errorType = yours === 0 ? 'yours' :
        total === 0 ? 'total' :
        extra === 0 ? 'extra' : '';
    if (errorType) {
        return error('Bill Split', `Missing argument: ${errorType}`);
    }

    const out = yours + (yours / total) * extra;
    output('Bill Split', `$${out} = ${yours} + ${yours}/${total} * ${extra}`);
};

main();
