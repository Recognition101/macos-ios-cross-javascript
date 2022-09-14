// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-green; icon-glyph: gift;
// share-sheet-inputs: url;

///<reference path="./types/wishlist.d.ts" />
///<reference path="./types/tunesQuery.d.ts" />
// @ts-ignore
// eslint-disable-next-line
try { require; } catch(e) { require = importModule; }

const {
    getInput, string, downloadJson, readJson, writeJson, error, output
} = require('./lib/lib.js');

const pathWish = '$/wishlist/wishlist.json';

const help = `Adds an app to the Wishlist JSON (creating JSON if missing).

Wishlist JSON Path: ${pathWish}
Wishlist JSON Type: $/types/wishlist.d.ts::Wishlist.AppMap`;

const main = async () => {
    const iTunesUrl = 'https://itunes.apple.com/lookup?id=';

    const input = await getInput({
        name: 'Wishlist Add',
        help,
        inScriptable: false,
        args: [{
            name: 'url',
            shortName: 'u',
            type: 'string',
            share: true,
            help: 'The iTunes URL for the app to add to the wishlist.'
        }]
    });
    if (!input) { return; }

    const url = string(input && input.url);
    const idMatch = url.match(/\/id(\d+)/);
    const id = idMatch && idMatch[1];

    if (!url || !id) {
        return error('Wishlist Add',
            !url ? 'No URL given, nothing added.' :
            !id ? 'Could not find App ID in URL!' : 'Error');
    }

    // Get Price, Name, and Image
    const searchJson = await downloadJson(iTunesUrl + id);
    const search = /** @type {TunesQuery|null} */(searchJson);
    const app = search && search.results && search.results[0];
    const name = app && app.trackName;
    const price = (app && app.price) || 0;
    const artUrl = app && app.artworkUrl512;

    if (!name || !artUrl) {
        return error('Wishlist Add',
            !name ? 'Could not fetch app name!' :
            !artUrl ? 'Could not fetch icon URL!' : 'Error');
    }

    const wishJson = await readJson(pathWish);
    const wish = /** @type {Wishlist.AppMap|null} */(wishJson) || { };
    wish[id] = { name, price, artUrl };
    await writeJson(pathWish, wish);
    output('Wishlist Add', `Item added to wishlist: ${name} @ $${price}`);
};

main();
