// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-green; icon-glyph: bookmark;
// share-sheet-inputs: url;

///<reference path="./types/lifeLog.d.ts" />
// @ts-ignore
// eslint-disable-next-line
try { require; } catch(e) { require = importModule; }

const {
    getInput, output, error,
    readJson, downloadJson
} = require('./lib/lib.js');

const {
    pathLog, pathActivities, pathSteamConfig,
    getParamString,
    makeActivityId, getKeyFromUrl,
    readLog, readActivities, writeLifeLogData
} = require('./lib/lifelog.js');

const apiSteamUrl = 'http://api.steampowered.com/';
const apiSteamGamesUrl = apiSteamUrl + 'IPlayerService/GetOwnedGames/v0001/?';

const help = `Adds all recently played steam games to the LifeLog.

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
        name: 'LifeLog Steam',
        help,
        inScriptable: false,
        args: []
    });

    if (!input) { return; }
    
    const steamConfigJson = (await readJson(pathSteamConfig));
    const steamConfig = /** @type {SteamData.Config|null} */(steamConfigJson);
    const steamUserId = steamConfig?.userId;
    const steamApiKey = steamConfig?.apiKey;
    if (!steamUserId || !steamApiKey) {
        const type = !steamUserId ? 'userId' : 'apiKey';
        return error('LifeLog Steam', `SteamData JSON missing: ${type}`);
    }

    const gameParams = getParamString({
        key: steamApiKey,
        steamid: steamUserId,
        format: 'json',
        include_played_free_games: 'true',
        include_appinfo: 'true'
    });
    const gameJson = /** @type {SteamData.GamesResponse|null} */(
        await downloadJson(apiSteamGamesUrl + gameParams)
    );
    const games = gameJson?.response?.games;
    if (!games || !Array.isArray(games)) {
        return error('LifeLog Steam', 'Could not download steam games.');
    }

    let newLogs = 0;
    let hasNewActivity = false;

    for(const game of games) {
        const timeLast = (game.rtime_last_played ?? 0) * 1000;
        const gameUrl = `https://store.steampowered.com/app/${game.appid}`;
        const { key } = getKeyFromUrl(gameUrl);

        if (game.appid && timeLast > 86400000) {
            if (!log.log[timeLast]) {
                log.log[timeLast] = makeActivityId(key, log);
                newLogs += 1;
            }
            if (game.name && !acts[key]) {
                hasNewActivity = true;
                acts[key] = {
                    key,
                    type: 'game',
                    subType: 'steam',
                    name: game.name,
                    timeCreated: timeLast
                };
            }
        }
    }

    await writeLifeLogData(log, acts, hasNewActivity);
    output('LifeLog Steam', `Logged ${newLogs} gameplay events.`);
};

main();
