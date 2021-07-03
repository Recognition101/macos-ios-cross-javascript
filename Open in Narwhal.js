// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-blue; icon-glyph: comments;
// share-sheet-inputs: plain-text, url;
// @ts-ignore
// eslint-disable-next-line
try { require; } catch(e) { require = () => importModule('lib/scriptable'); }

const { getInput, string, open, paste } = require('./lib/node.js');

const main = async () => {
    const input = await getInput({
        help: 'Opens a page in the Narwhal app.',
        inScriptable: true,
        args: [{
            name: 'url',
            shortName: 'u',
            type: 'string',
            share: true,
            help: 'A Reddit URL to open in Narwhal.'
        }]
    });

    if (!input) { return; }
    const url = string(input.url) || paste();

    if (url && /reddit/.test(url)) {
        open('narwhal://open-url/' + url);
    }
};

main();
