// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: blue; icon-glyph: cut; share-sheet-inputs: plain-text;
// @ts-ignore
// eslint-disable-next-line
try { require; } catch(e) { require = importModule; }

const { getInput, string, copy, paste, output } = require('./lib/lib.js');

const mainRemoveFormatting = async () => {
    const input = await getInput({
        name: 'Word Unprefix',
        help: 'Trims non-word prefixes from the each line.',
        inScriptable: false,
        args: [{
            name: 'string',
            shortName: 's',
            help: 'The string to trim.',
            type: 'string',
            share: true
        }]
    });

    if (!input) { return; }

    const init = string(input.string) || paste();
    const prefix = init.replace(/^\W*/mg, '');

    copy(prefix);
    output('Word Unprefix', 'Text with no prefix copied to clipboard.');
};

mainRemoveFormatting();
