// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-blue; icon-glyph: archive;
// share-sheet-inputs: plain-text, url;
// @ts-ignore
// eslint-disable-next-line
try { require; } catch(e) { require = importModule; }

const { getInput, string, open, paste } = require('./lib/lib.js');

const main = async () => {
    const input = await getInput({
        name: 'Open in CamelCamelCamel',
        help: 'Opens an Amazon page on CamelCamelCamel.',
        inScriptable: true,
        args: [{
            name: 'url',
            shortName: 'u',
            type: 'string',
            share: true,
            help: 'An Amazon URL to open on CamelCamelCamel.'
        }]
    });

    if (!input) { return; }

    const url = string(input.url) || paste();
    const product = url.match(/\/dp\/([^/]+)/)?.[1] ?? '';
    if (product) {
        open(`https://camelcamelcamel.com/product/${product}`);
    }
};

main();
