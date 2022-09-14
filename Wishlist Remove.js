// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: red; icon-glyph: gift; share-sheet-inputs: url;

///<reference path="./types/wishlist.d.ts" />
///<reference path="./types/tunesQuery.d.ts" />

// @ts-ignore
// eslint-disable-next-line
try { require; } catch(e) { require = importModule; }

const {
    getInput, string, readJson, writeJson, error, output 
} = require('./lib/lib.js');

const pathWish = '$/wishlist/wishlist.json';

const help = `Removes an app from the Wishlist JSON.

Wishlist JSON Path: ${pathWish}
Wishlist JSON Type: $/types/wishlist.d.ts::Wishlist.AppMap`;

const main = async () => {
    const input = await getInput({
        name: 'Wishlist Remove',
        help,
        inScriptable: false,
        args: [{
            name: 'url',
            shortName: 'u',
            type: 'string',
            share: true,
            help: 'The iTunes URL for the app to remove from the wishlist.'
        }]
    });

    if (!input) { return; }

    const idMatch = string(input.url).match(/\/id(\d+)/);
    const id = idMatch && idMatch[1];
    if (!id) {
        return error('Wishlist Remove', 'Could not find App ID in URL!');
    }

    const wishJson = await readJson(pathWish);
    const wish = /** @type {Wishlist.AppMap|null} */(wishJson);
    if (wish && wish[id]) {
        delete wish[id];
        await writeJson(pathWish, wish);
        output('Wishlist Remove', 'Wishlist item removed.');
    } else {
        output('Wishlist Remove', 'Item was not on wishlist.');
    }
};

main();
