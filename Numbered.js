// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: blue; icon-glyph: list-ol; share-sheet-inputs: plain-text;
// @ts-ignore
// eslint-disable-next-line
try { require; } catch(e) { require = importModule; }

const { getInput, string, paste, output } = require('./lib/lib.js');

const linePrefix = /^\s*(\d+.|\d+\s*-|-)\s*/;

const main = async () => {
    const input = await getInput({
        name: 'Numbered',
        help: 'Numbers non-blank lines, removing existing numbering.',
        inScriptable: false,
        outputType: 'data',
        args: [{
            name: 'string',
            shortName: 's',
            help: 'The string to number.',
            type: 'string',
            share: true
        }]
    });

    if (!input) { return; }

    const inText = string(input.string) || paste();
    let count = 1;

    const outText = inText
        .split('\n')
        .map(lineFull => {
            const line = lineFull.trim();
            const lineNoPrefix = line.replace(linePrefix, '');
            const lineNew = line === '' ? '' : `${count}. ${lineNoPrefix}`;
            count = line === '' ? 1 : (count + 1);
            return lineNew;
        })
        .join('\n');

    output('Numbered', outText);
};

main();
