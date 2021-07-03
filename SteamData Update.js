// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: yellow; icon-glyph: cloud-download-alt;

///<reference path="./types/steam.d.ts" />
// @ts-ignore
// eslint-disable-next-line
try { require; } catch(e) { require = () => importModule('lib/scriptable'); }

const {
    getInput, downloadJson, readJson, writeJson, status, error
} = require('./lib/node.js');

// To get Steam API Key: https://steamcommunity.com/dev/apikey
const apiUrl = 'http://api.steampowered.com/';
const apiGamesUrl = apiUrl + 'IPlayerService/GetOwnedGames/v0001/?';
const apiStatsUrl = apiUrl + 'ISteamUserStats/GetPlayerAchievements/v0001/?';

/**
 * @param {SteamData.Parameters} params
 * @return {string}
 */
const getParamString = params =>
    Object.entries(params).map(([k, v]) => `${k}=${v}`).join('&');

const pathConfig = '$/steamdata/steam-config.json';
const pathOutput = '$/steamdata/userdata.json';

const help = `Downloads all steam user data as a backup.

Setup: Manually create the SteamData JSON file.

SteamData JSON Path: ${pathConfig}
SteamData JSON Type: $/types/steam.d.ts::SteamData.Config
Output JSON Path: ${pathOutput}
Output JSON Type: $/types/steam.d.ts::SteamData.UserData`;

const main = async () => {
    const input = await getInput({ help, inScriptable: true, args: [ ] });
    if (!input) { return; }

    const configJson = (await readJson(pathConfig));
    const config = /** @type {SteamData.Config|null} */(configJson);
    const userId = config?.userId;
    const apiKey = config?.apiKey;

    if (!userId || !apiKey) {
        const type = !userId ? 'userId' : 'apiKey';
        return error('SteamData Update', `SteamData JSON missing: ${type}`);
    }

    /** @type {SteamData.UserData} */
    const result = { games: [ ] };

    const gameJson = /** @type {SteamData.GamesResponse} */(await downloadJson(
        apiGamesUrl +
        getParamString({
            key: apiKey,
            steamid: userId,
            format: 'json',
            include_played_free_games: 'true',
            include_appinfo: 'true'
        })
    ));

    const games = gameJson && gameJson.response && gameJson.response.games;
    if (!games) {
        error('SteamData Update Error', 'Could not GET Steam Games API.');
        return;
    }

    const playedGames = games.filter(x => x.playtime_forever > 0);

    for(const [i, game] of playedGames.entries()) {
        status(`Checking ${i} / ${playedGames.length}`);
        const stats = /** @type {SteamData.StatsResponse} */(
            await downloadJson(
                apiStatsUrl +
                getParamString({
                    key: apiKey,
                    steamid: userId,
                    l: 'en',
                    appid: game.appid.toString()
                })
            )
        );
        const achievements = stats && stats.playerstats.achievements;
        if (achievements) {
            result.games.push({ game, achievements });
        }
    }

    // Write Activity Data
    writeJson(pathOutput, result);
    status('Done Updating.');
};

main();
