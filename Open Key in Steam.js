// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-blue; icon-glyph: key; share-sheet-inputs: plain-text, url;
// @ts-ignore
// eslint-disable-next-line
try { require; } catch(e) { require = () => importModule('lib/scriptable'); }

const { getInput, string, open, paste } = require('./lib/node.js');

const main = async () => {
    const input = await getInput({
        help: 'Given a Steam Key, open the key activation page.',
        inScriptable: true,
        args: [{
            name: 'key',
            shortName: 'k',
            help: 'The key to open the activation page with',
            type: 'string',
            share: true
        }]
    });

    if (!input) { return; }

    const key = string(input.key) || paste();
    const url = 'https://store.steampowered.com/account/registerkey?key=';
    open(url + key);
};

main();

