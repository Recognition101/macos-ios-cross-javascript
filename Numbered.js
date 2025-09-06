// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: blue; icon-glyph: list-ol; share-sheet-inputs: plain-text;
// @ts-ignore
// eslint-disable-next-line
try { require; } catch(e) { require = importModule; }

const { getInput, string, output } = require('./lib/lib.js');

const getLineParts = /^(\s*)((?:\d+\.|\d+\s*-|-)\s)?(.*)$/;

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

    const inText = string(input.string);
    const indentCounts = /** @type {Map<number, number>} */(new Map());

    const outText = inText
        .split('\n')
        .map(input => {
            const inputMatch = input.match(getLineParts);
            const indentText = inputMatch?.[1] ?? '';
            const text = inputMatch?.[3] ?? '';
            const indent = Iterator.from(indentText)
                .reduce((count, c) => count + (c === '\t' ? 4 : 1), 0);

            const count = (indentCounts.get(indent) ?? 0) + 1;
            indentCounts.set(indent, count);
            for(const indentB of indentCounts.keys()) {
                if (indent < indentB) {
                    indentCounts.set(indentB, 0);
                }
            }

            return `${indentText}${count}. ${text}`;
        })
        .join('\n');

    output('Numbered', outText);
};

main();
