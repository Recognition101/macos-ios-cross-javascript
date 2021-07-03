// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: yellow; icon-glyph: sync-alt;

///<reference path="./types/appActivity.d.ts" />
///<reference path="./types/tunesQuery.d.ts" />
///<reference path="./types/featuredGame.d.ts" />
// @ts-ignore
// eslint-disable-next-line
try { require; } catch(e) { require = () => importModule('lib/scriptable'); }

const lib = require('./lib/node.js');
const { getInput, string, readJson, writeJson, downloadJson, status } = lib;

const iTunesUrl = 'https://itunes.apple.com/lookup?id=';
const pathActivity = '$/appactivity/activity.json';

const help = `Looks up the last-modified-date for every iOS app in a given
Apps JSON file, writing the dates to the Activity JSON file.

Setup: Manually create the Apps JSON file.

Apps JSON Path: (Provided with -a or --apps flag)
Apps JSON Type: $/types/appActivity.d.ts::AppActivities
Apps JSON Example:
    raw.githubusercontent.com/Recognition101/ios-games/master/data.json
Activity JSON Path: ${pathActivity}
Activity JSON Type: $/types/appActivity.d.ts::AppActivities`;

const main = async () => {
    const input = await getInput({
        help,
        inScriptable: true,
        args: [{
            name: 'apps',
            shortName: 'a',
            type: 'pathFile',
            bookmarkName: 'appactivity-update-apps',
            help: 'The manifest of apps to find last-modified-date for.'
        }]
    });
    if (!input) { return; }

    const pathApps = string(input.apps);
    const appMap = /** @type {FeaturedGames|null} */(await readJson(pathApps));
    const apps = Array.from(Object.entries(appMap || { }));

    status(`Checking 0 / ${apps.length}`);

    const appActivities = /** @type {AppActivities} */({});

    for(const [i, [id, app]] of apps.entries()) {
        const name = app.name;
        status(`Checking ${i} / ${apps.length}`);

        const url = iTunesUrl + id;
        const query = /** @type {TunesQuery|null} */(await downloadJson(url));
        const result = query && query.results[0];

        if (result) {
            const lastUpdated = result.currentVersionReleaseDate;
            const artUrl = result.artworkUrl512;
            appActivities[id] = { id, name, artUrl, lastUpdated };
        } else {
            const lastUpdated = /** @type {string|null} */(null);
            const artUrl = /** @type {string|null} */(null);
            appActivities[id] = { id, name, artUrl, lastUpdated };
        }
    }

    // Write Activity Data
    writeJson(pathActivity, appActivities);
    status('Done Updating.');
};

main();
