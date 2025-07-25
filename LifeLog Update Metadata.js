// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: yellow; icon-glyph: atlas;

///<reference path="./types/lifeLog.d.ts" />
///<reference path="./types/itch.d.ts" />
// @ts-ignore
// eslint-disable-next-line
try { require; } catch(e) { require = importModule; }

const {
    getInput, readJson, downloadText, downloadJson,
    error, status, output,
    external
} = require('./lib/lib.js');

const { select, getTextContent } = require('./lib/parse5.js');

const {
    pathLog, pathActivities, pathSteamConfig,
    getParamString,
    getActivityTimeBounds, getKeyFromUrl,
    readLog, readActivities, writeLifeLogData
} = require('./lib/lifelog.js');

const apiUrlApple = 'https://itunes.apple.com/lookup?id=';
const apiUrlSteam = 'https://store.steampowered.com/api/appdetails?';

const help = `Updates the activity metadata JSON file, adding metadata
describing each recorded URL activity.

Setup: Manually create the SteamData JSON file.

SteamData JSON Path: ${pathSteamConfig}
SteamData JSON Type: $/types/steam.d.ts::SteamData.Config
LifeLog JSON Path: ${pathLog}
LifeLog JSON Type: $/types/lifeLog.d.ts::LifeLog
LifeLog Activities JSON Path: ${pathActivities}
LifeLog Activities JSON Type: $/types/lifeLog.d.ts::LifeLogActivities`;

const main = async () => {
    const log = await readLog();
    const acts = await readActivities();

    const input = await getInput({
        name: 'LifeLog Update Metadata',
        help,
        inScriptable: true,
        args: []
    });

    if (!input) { return; }
    
    const steamConfigJson = (await readJson(pathSteamConfig));
    const steamConfig = /** @type {SteamData.Config|null} */(steamConfigJson);
    const steamUserId = steamConfig?.userId;
    const steamApiKey = steamConfig?.apiKey;
    if (!steamUserId || !steamApiKey) {
        return error(
            'LifeLog Update Metadata',
            `SteamData JSON missing: ${!steamUserId ? 'userId' : 'apiKey'}`
        );
    }

    const now = (new Date()).getTime();
    const timeBounds = getActivityTimeBounds(log);

    /** @type {string[]} */
    const failed = [ ];
    let newCount = 0;

    const keyIdPairs = Object.entries(log.idMap)
        .filter(([ key ]) => !(key in acts));

    for(const [ i, [ key, id ] ] of keyIdPairs.entries()) {
        status(`Fetching ${i + 1} / ${keyIdPairs.length}`);
        const { key: url, urlType, urlId } = getKeyFromUrl(key);

        if (urlType === 'apple' && urlId) {
            const searchJson = await downloadJson(apiUrlApple + urlId);
            const search = /** @type {TunesQuery|null} */(searchJson);
            const name = search?.results[0]?.trackName;
            if (name) {
                newCount += 1;
                const subType = 'apple';
                const timeCreated = timeBounds.get(id)?.min ?? now;
                acts[key] = { key, type: 'game', subType, name, timeCreated };
            } else {
                failed.push(key);
            }
        }

        if (urlType === 'pico8' && urlId) {
            const html = await downloadText(url);
            const document = external.parse5.parse(html);
            const title = select(document, { tagName: 'title' })[0];
            const name = title ? getTextContent(title) : '';

            if (name) {
                newCount += 1;
                const subType = 'pico8';
                const timeCreated = timeBounds.get(id)?.min ?? now;
                acts[key] = { key, type: 'game', subType, name, timeCreated };
            } else {
                failed.push(key);
            }
        }

        if (urlType === 'steam' && urlId) {
            const storeParams = getParamString({ appids: urlId });
            const gameJson = /** @type {SteamData.StoreItemResponse} */(
                await downloadJson(apiUrlSteam + storeParams)
            );
            const name = gameJson?.[urlId]?.data?.name;

            if (name) {
                newCount += 1;
                const subType = 'steam';
                const timeCreated = timeBounds.get(id)?.min ?? now;
                acts[key] = { key, type: 'game', subType, name, timeCreated };
            } else {
                failed.push(key);
            }
        }

        if (urlType === 'itch' && urlId) {
            const metadata = /** @type {ItchIo.GameMetadata|null} */(
                await downloadJson(`${key}/data.json`)
            );
            if (metadata && metadata.title) {
                newCount += 1;
                const subType = 'itch';
                const timeCreated = timeBounds.get(id)?.min ?? now;
                const name = metadata.title;
                acts[key] = { key, type: 'game', subType, name, timeCreated };
            } else {
                failed.push(key);
            }
        }

        if (urlType === 'playdate' && urlId) {
            const html = await downloadText(url);
            const doc = external.parse5.parse(html);
            const title = select(doc, { tagName: 'h1' })[0] ?? null;
            const titleImg = select(title, { tagName: 'img' })[0];
            const name =
                titleImg?.attrs.find(x => x.name === 'alt')?.value ||
                (title ? getTextContent(title) : '') ||
                '';
            if (name) {
                newCount += 1;
                const subType = 'playdate';
                const timeCreated = timeBounds.get(id)?.min ?? now;
                acts[key] = { key, type: 'game', subType, name, timeCreated };
            } else {
                failed.push(key);
            }
        }
    }

    await writeLifeLogData(log, acts, true);

    const failCount = failed.length;
    const outStats = `${newCount} added, ${failCount} failed.`;
    const outFailures = failCount > 0 ? `\n${failed.join('\n')}\n` : '\n';
    const outSummary = `LifeLog Activity Changes: ${outStats}`;
    status(outSummary + ' Failures:' + outFailures);
    output('LifeLog Update Metadata', outSummary);
};

main();
