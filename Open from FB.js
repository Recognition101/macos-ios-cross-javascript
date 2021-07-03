// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-blue; icon-glyph: users;
// share-sheet-inputs: plain-text, url;
// @ts-ignore
// eslint-disable-next-line
try { require; } catch(e) { require = () => importModule('lib/scriptable'); }

const { getInput, string, open, paste } = require('./lib/node.js');

const main = async () => {
    const input = await getInput({
        help: 'Opens a page through a facebook redirect, avoiding paywalls.',
        inScriptable: true,
        args: [{
            name: 'url',
            shortName: 'u',
            type: 'string',
            share: true,
            help: 'A URL to open through a facebook redirect.'
        }]
    });

    if (!input) { return; }

    const url = string(input.url) || paste();
    open('https://facebook.com/l.php?u=' + encodeURIComponent(url));
};

main();
