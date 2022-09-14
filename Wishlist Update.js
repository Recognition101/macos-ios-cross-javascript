// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: yellow; icon-glyph: gift;

///<reference path="./types/wishlist.d.ts" />
///<reference path="./types/tunesQuery.d.ts" />
// @ts-ignore
// eslint-disable-next-line
try { require; } catch(e) { require = importModule; }

const {
    getInput, downloadJson, readJson, writeJson, status, log, output
} = require('./lib/lib.js');

const pathWish = '$/wishlist/wishlist.json';
const pathSale = '$/wishlist/wishlist-sale.json';

const help = `Reads the Wishlist JSON, creates a Sale JSON with sale prices.

Wishlist JSON Path: ${pathWish}
Wishlist JSON Type: $/types/wishlist.d.ts::Wishlist.AppMap
Sale JSON Path: ${pathSale}
Sale JSON Type: $/types/wishlist.d.ts::Wishlist.AppMap`;

const main = async () => {
    const name = 'Wishlist Update';
    const input = await getInput({ name, help, inScriptable: true });
    if (!input) { return; }

    const iTunesUrl = 'https://itunes.apple.com/lookup?id=';
    const previewUrl = 'https://apps.apple.com/us/app/';

    // Read Wishlist
    const wishJson = await readJson(pathWish);
    const wish = /** @type {Wishlist.AppMap|null} */(wishJson) || { };
    const sale = /** @type {Wishlist.AppMap} */({});

    const wishMax = Object.keys(wish).length;
    let wishIndex = 0;

    status(`Checking 0 / ${wishMax}`);

    // Download Prices to Sale List
    for(const id in wish) {
        wishIndex += 1;
        status(`Checking ${wishIndex} / ${wishMax}`);

        const item = wish[id];

        const queryJson = await downloadJson(iTunesUrl + id);
        const query = /** @type {TunesQuery|null} */(queryJson);
        const result = query && query.results[0];
        if (result && result.price < item.price) {
            sale[id] = {
                name: item.name,
                price: item.price,
                artUrl: item.artUrl,
                salePrice: result.price
            };
        }
    }

    // Write Sale List
    writeJson(pathSale, sale);
    status('Done Updating.');
    for(const id in sale) {
        const { price, salePrice, name } = sale[id];
        log(`${price} -> ${salePrice}: ${name} (${previewUrl}id${id})`);
    }
    output('Wishlist Update', 'Wishlist updated.');
};

main();
