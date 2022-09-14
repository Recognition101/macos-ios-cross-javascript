// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: blue; icon-glyph: cut; share-sheet-inputs: plain-text;
// @ts-ignore
// eslint-disable-next-line
try { require; } catch(e) { require = importModule; }

const { getInput, string, copy, paste, output } = require('./lib/lib.js');

const main = async () => {

    const input = await getInput({
        name: 'Word Unformat',
        help: 'Removes a string\'s formatting and copies it to the clipboard.',
        inScriptable: false,
        args: [{
            name: 'string',
            shortName: 's',
            help: 'The string to remove formatting from (and copy).',
            type: 'string',
            share: true
        }]
    });

    if (!input) { return; }

    const outText = string(input.string) || paste();
    copy(outText);
    output('Word Unformat', 'Unformatted text copied to clipboard.');
};

main();
