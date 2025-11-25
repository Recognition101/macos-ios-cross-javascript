// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: blue; icon-glyph: coffee; share-sheet-inputs: plain-text;
// @ts-ignore
// eslint-disable-next-line
try { require; } catch(e) { require = importModule; }

const { getInput, string, output } = require('./lib/lib.js');

/**
 * Parses some text as JSON, returning the text as a string if it is not JSON
 * @param {string} text the text to parse
 * @return {any} the parsed JSON, or `text` if it could not be parsed
 */
const parseJson = text => {
    try {
        return JSON.parse(text);
    } catch(e) {
        return text;
    }
};

const main = async () => {
    const input = await getInput({
        name: 'Jst',
        help: 'Uses JS to transform some input text.',
        inScriptable: false,
        outputType: 'data',
        args: [{
            name: 'input',
            shortName: 'i',
            type: 'string',
            share: true,
            help: 'The text to use as the $ variable in the given snippet.'
        }, {
            name: 'transform',
            shortName: 't',
            type: 'string',
            help: 'The JS snippet to run, outputting the result.'
        }]
    });

    if (!input) { return; }

    const text = parseJson(string(input.input));
    const code = string(input.transform);
    output('JST', eval(`const $ = ${JSON.stringify(text)}; ${code}`));
};

main();
