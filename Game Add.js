// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-green; icon-glyph: gamepad;
// share-sheet-inputs: url;

///<reference path="./types/featuredGame.d.ts" />
///<reference path="./types/tunesQuery.d.ts" />
// @ts-ignore
// eslint-disable-next-line
try { require; } catch(e) { require = importModule; }

const {
    getInput, string, downloadJson, readJson, writeJson, downloadFile,
    output, error, pathJoin, makeDirectory
} = require('./lib/lib.js');

const fileNameData = 'data.json';
const fileNameIcon = 'images';

const help = `Asks for information about an iOS game and a {{folder}} path, to:
  1. Add the information to:    {{folder}}/${fileNameData}
  2. Download an icon image to: {{folder}}/${fileNameIcon}/id{{GameID}}.jpg

Setup: Manually create the Data JSON file.

Data JSON Path: {{folder}}/${fileNameData}
Data JSON Type: $/types/featuredGame.d.ts::FeaturedGames
Data JSON Example:
    raw.githubusercontent.com/Recognition101/ios-games/master/data.json`;

const main = async () => {
    const iTunesUrl = 'https://itunes.apple.com/lookup?id=';

    const input = await getInput({
        name: 'Game Add',
        help,
        inScriptable: true,
        args: [{
            name: 'folder',
            shortName: 'f',
            help: 'The folder to update the JSON and download the image to.',
            type: 'pathFolder',
            bookmarkName: 'game-add-folder'
        }, {
            name: 'url',
            shortName: 'u',
            help: 'The iTunes URL of the game to add.',
            type: 'string',
            share: true
        }, {
            name: 'name',
            shortName: 'n',
            help: 'The name of the game.',
            type: 'string'
        }, {
            name: 'iphone',
            shortName: 'p',
            help: 'True if it supports iPhone.',
            type: 'boolean'
        }, {
            name: 'ipad',
            shortName: 'a',
            help: 'True if it supports iPad.',
            type: 'boolean'
        }, {
            name: 'appletv',
            shortName: 't',
            help: 'True if it supports Apple TV.',
            type: 'boolean'
        }, {
            name: 'cloud',
            shortName: 'c',
            help: 'True if it supports iCloud.',
            type: 'boolean'
        }, {
            name: 'mfi',
            shortName: 'm',
            help: 'True if it supports MFi gamepads.',
            type: 'boolean'
        }, {
            name: 'end',
            shortName: 'e',
            help: 'True if the game has a defined end.',
            type: 'boolean'
        }, {
            name: 'world',
            shortName: 'w',
            help: 'True if the game has an over-world.',
            type: 'boolean'
        }, {
            name: 'multiplayer',
            shortName: 'l',
            help: 'True if the game supports multiplayer.',
            type: 'boolean'
        }]
    });

    if (!input) { return; }

    const idMatch = string(input.url).match(/\/id(\d+)/);
    const id = idMatch && idMatch[1];
    const name = string(input.name);

    if (!id || !name) {
        return error('Game Add',
            !id ? 'Could Not Parse URL for App ID Number!' :
            !name ? 'You must provide a name!' : 'Error'
        );
    }

    // Download Image
    const searchJson = await downloadJson(iTunesUrl + id);
    const search = /** @type {TunesQuery|null} */(searchJson);
    const app = search && search.results && search.results[0];
    const artUrl = app && app.artworkUrl512;

    if (!artUrl) {
        return error('Game Add', 'Could Not Fetch Icon URL!');
    }

    const pathRoot = string(input.folder);
    const pathData = pathJoin(pathRoot, fileNameData);
    const pathIcon = pathJoin(pathRoot, fileNameIcon, `id${id}.jpg`);

    // Download / add new data
    await makeDirectory(pathJoin(pathRoot, fileNameIcon));
    await downloadFile(artUrl, pathIcon);
    const appsJson = await readJson(pathData);
    const apps = /** @type {FeaturedGames|null} */(appsJson) || { };

    apps[id] = {
        name:  name,
        phone: Boolean(input.iphone) || undefined,
        pad:   Boolean(input.ipad) || undefined,
        tv:    Boolean(input.appletv) || undefined,
        cloud: Boolean(input.cloud) || undefined,
        mfi:   Boolean(input.mfi) || undefined,
        ends:  Boolean(input.end) || undefined,
        map:   Boolean(input.world) || undefined,
        multi: Boolean(input.multiplayer) || undefined
    };

    writeJson(pathData, apps);
    output('Game Add', 'Game Added: ' + name);
};

main();
