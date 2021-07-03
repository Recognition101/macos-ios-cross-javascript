// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-blue; icon-glyph: archive;
// share-sheet-inputs: plain-text, url;
// @ts-ignore
// eslint-disable-next-line
try { require; } catch(e) { require = () => importModule('lib/scriptable'); }

const { getInput, string, open, paste } = require('./lib/node.js');

const main = async () => {
    const input = await getInput({
        help: 'Opens a page on an internet archive service.',
        inScriptable: true,
        args: [{
            name: 'url',
            shortName: 'u',
            type: 'string',
            share: true,
            help: 'A URL to open on an internet archive.'
        }]
    });

    if (!input) { return; }

    const date = new Date();
    const dateStr = date.getFullYear() + '.' +
        (date.getMonth() + 1).toString().padStart(2, '0') + '.' +
        date.getDate().toString().padStart(2, '0') + '-' +
        date.getHours().toString().padStart(2, '0') + ':' +
        date.getMinutes().toString().padStart(2, '0') + ':' +
        date.getSeconds().toString().padStart(2, '0');

    const url = string(input.url) || paste();
    open(`https://archive.is/${dateStr}/${encodeURIComponent(url)}`);
};

main();
