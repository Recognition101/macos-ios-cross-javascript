// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-blue; icon-glyph: taxi; share-sheet-inputs: plain-text, url;
// @ts-ignore
// eslint-disable-next-line
try { require; } catch(e) { require = () => importModule('lib/scriptable'); }

const { getInput, string, open, error, output } = require('./lib/node.js');

const main = async () => {
    const input = await getInput({
        help: 'Gets a lyft ride to the passed in URL.',
        inScriptable: true,
        args: [{
            name: 'url',
            shortName: 'u',
            type: 'string',
            share: true,
            help: 'An Apple Maps URL to the place you want to go.'
        }]
    });

    if (!input) { return; }
    const match = string(input.url).match(/&ll=([-\d.]+),([-\d.]+)/);

    if (match) {
        output('Open in Lyft', `Navigating to ${match[1]},${match[2]}`);
        open('lyft://ridetype?id=lyft' +
            '&destination[latitude]=' + match[1] +
            '&destination[longitude]=' + match[2]);
    } else {
        error('Open in Lyft', 'Could not parse: ' + input.url);
    }
};

main();
