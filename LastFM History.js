// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: yellow; icon-glyph: music;
/// <reference path="./types/LastFm.d.ts" />
// @ts-ignore
// eslint-disable-next-line
try { require; } catch(e) { require = importModule; }

const {
    getInput, string, error, output, status,
    downloadJson, readJson, writeJson, makeDirectory
} = require('./lib/lib.js');

const pathOutputFolder = '$/music/';
const pathOutput = '$/music/history.json';
const pathConfig = '$/music/lastfm-config.json';

const help = `Downloads LastFM history to a JSON file.
This script uses a configuration file to provide default argument values.

Setup: Manually create the LastFM JSON file.

LastFM JSON Path: ${pathConfig}
LastFM JSON Type: $/types/LastFm.d.ts::LastFm.Config
Output JSON Path: ${pathOutput}
Output JSON Type: $/types/LastFm.d.ts::LastFm.JsonTracks`;

const main = async () => {
    const input = await getInput({
        name: 'LastFM History',
        help,
        inScriptable: true,
        args: [{
            name: 'user',
            shortName: 'u',
            type: 'string',
            help: 'The user to download from (default: read from Config JSON)'
        }, {
            name: 'key',
            shortName: 'k',
            type: 'string',
            help: 'The API key to use (default: read from Config JSON).'
        }]
    });

    if (!input) { return; }

    const configJson = (await readJson(pathConfig));
    const config = /** @type {LastFm.Config|null} */(configJson);
    const user = string(input.user) || config?.username;
    const key = string(input.key) || config?.key;

    if (!user || !key) {
        error('LastFM History', 'Did not provide username or key!');
        return;
    }

    /** @type {LastFm.JsonTracks} */
    const json = { tracks: [ ] };

    /** @type {LastFm.Track[]} */
    let tracks = [ ];

    for(let i=1; i === 1 || tracks.length > 0; i += 1) {
        const url = 'https://ws.audioscrobbler.com/2.0/' +
            '?method=user.getrecenttracks' +
            '&user=' + user +
            '&api_key=' + key +
            '&limit=200' +
            '&page=' + i +
            '&format=json';

        /** @type {LastFm.Response|null} */
        const response = await downloadJson(url);
        tracks = (response
            && response.recenttracks
            && response.recenttracks.track) || [ ];

        for(const track of tracks) {
            json.tracks.push({
                name: track.name,
                album: track.album['#text'],
                artist: track.artist.name || track.artist['#text'],
                timestamp: Number((track.date && track.date.uts) || 0) * 1000,
                time: (track.date && track.date['#text']) || ''
            });
        }

        status(`Downloading page ${i}...`);
    }

    await makeDirectory(pathOutputFolder);
    await writeJson(pathOutput, json);
    output('LastFM History', 'Download complete!            ');
};

main();
