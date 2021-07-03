// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: purple; icon-glyph: key; share-sheet-inputs: plain-text, url;
// @ts-ignore
// eslint-disable-next-line
try { require; } catch(e) { require = () => importModule('lib/scriptable'); }

const {
    getInput, string, readText, copy, output, error
} = require('./lib/node.js');

const main = async () => {
    const input = await getInput({
        help: 'Generates a random series of concatenated words.',
        inScriptable: false,
        args: [{
            name: 'length',
            shortName: 'l',
            help: 'The number of words to use (5).',
            type: 'string'
        }, {
            name: 'delimiter',
            shortName: 'd',
            help: 'The word separator (-).',
            type: 'string'
        }]
    });

    if (!input) { return; }

    const length = Number(input.length) || 5;
    const delimiter = string(input.delimiter) || '-';

    const text = await readText('$/lib/data/dict.txt');
    if (!text) {
        return error('Pass New Words', 'Could not read: dict.txt');
    }

    const words = text.split('\n');

    const password = (Array(length).fill(0))
        .map(() => words[Math.floor(Math.random()*words.length)].toLowerCase())
        .join(delimiter);

    copy(password);
    output('Pass New Words', 'New password copied to clipboard.');
};

main();

