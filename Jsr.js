// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: blue; icon-glyph: terminal; share-sheet-inputs: plain-text;
// @ts-ignore
// eslint-disable-next-line
try { require; } catch(e) { require = importModule; }

const { getInput, string, output } = require('./lib/lib.js');

/**
 * @template T
 * @typedef {T|T[]} MaybeArray
 */
/**
 * @typedef {string|number|(string|number)[]} NumericInput
 */

/**
 * @param {string} code the code to run
 * @return {any} the result
 */
const run = (code) => {
    /** @type {<T>(obj: MaybeArray<T>) => T[]} */
    const boxArray = obj => Array.isArray(obj) ? obj : [ obj ];

    /** @type {(str: string|number) => number[]} */
    const stringToNumbers = str => typeof str === 'number'
         ? [ str ]
         : str.match(/-?\d+(\.\d+)?/g)?.map(x => Number(x)) ?? []; 

    /** @type {(...args: NumericInput[]) => number[]} */
    const Numbers = (...args) =>
        args.flat(10).flatMap(x => stringToNumbers(x));

    /** @type {(...args: NumericInput[]) => number} */
    const sum = (...args) => Numbers(...args).reduce((x, y) => x + y, 0);

    /** @type {(...args: NumericInput[]) => number} */
    const min = (...args) => Math.min(...Numbers(...args));

    /** @type {(...args: NumericInput[]) => number} */
    const max = (...args) => Math.max(...Numbers(...args));

    // Math Functions
    const abs = Math.abs.bind(Math);
    const ceil = Math.ceil.bind(Math);
    const floor = Math.floor.bind(Math);
    const round = Math.round.bind(Math);
    const sign = Math.sign.bind(Math);
    const random = Math.random.bind(Math);
    const rand = Math.random.bind(Math);
    const pow = Math.pow.bind(Math);
    const sqrt = Math.sqrt.bind(Math);
    const log = Math.log.bind(Math);
    const log2 = Math.log2.bind(Math);
    const log10 = Math.log10.bind(Math);

    // Trig Functions (Single Argument)
    const acos = Math.acos.bind(Math);
    const acosh = Math.acosh.bind(Math);
    const asin = Math.asin.bind(Math);
    const asinh = Math.asinh.bind(Math);
    const atan = Math.atan.bind(Math);
    const atanh = Math.atanh.bind(Math);
    const atan2 = Math.atan2.bind(Math);
    const cos = Math.cos.bind(Math);
    const cosh = Math.cosh.bind(Math);
    const sin = Math.sin.bind(Math);
    const sinh = Math.sinh.bind(Math);
    const tan = Math.tan.bind(Math);
    const tanh = Math.tanh.bind(Math);

    return eval(code);
};

const main = async () => {
    const input = await getInput({
        name: 'Jsr',
        help: 'Runs a JS snippet.',
        inScriptable: false,
        outputType: 'data',
        args: [{
            name: 'input',
            shortName: 'i',
            type: 'string',
            share: true,
            help: 'The JS code to run.'
        }]
    });

    if (!input) { return; }

    const noQuotes = string(input.input)
        .replace(/\u201c|\u201d/g, '"')
        .replace(/\u2018|\u2019/g, '\'');

    output('JSR', run(noQuotes));
};

main();
