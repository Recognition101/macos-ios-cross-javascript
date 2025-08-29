// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: blue; icon-glyph: book-open; share-sheet-inputs: plain-text;
// @ts-ignore
// eslint-disable-next-line
try { require; } catch(e) { require = importModule; }

const { getInput, string, output, paste } = require('./lib/lib.js');

const mainWordCount = async () => {
    const input = await getInput({
        name: 'Word Count',
        help: 'Counts the number of words in a given string.',
        inScriptable: false,
        outputType: 'data',
        args: [{
            name: 'string',
            shortName: 's',
            help: 'The string to count the words within.',
            type: 'string',
            share: true
        }]
    });

    if (!input) { return; }

    const str = string(input.string) || paste();
    const bounds = /\w+/g;
    const wordCount = (str.match(bounds) || []).length;
    output('Word Count', wordCount);
};

mainWordCount();
