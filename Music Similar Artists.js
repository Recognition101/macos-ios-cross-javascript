// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: yellow; icon-glyph: music;

///<reference path="./types/LastFm.d.ts" />
// @ts-ignore
// eslint-disable-next-line
try { require; } catch(e) { require = importModule; }

const {
    getInput, downloadJson, readJson, writeJson,
    error, log, status, encodeURIComponent, string
} = require('./lib/lib.js');

/**
 * Encodes a map of key/values into a URI string.
 * @param {{[key: string]: string}} obj the map to encode
 * @return {string} the encoded string
 */
const encodeUriMap = obj => Object.entries(obj)
    .map(([k, v]) => encodeURIComponent(k) + '=' + encodeURIComponent(v))
    .join('&');

const pathConfig = '$/music/lastfm-config.json';
const pathArtists = '$/music/artists.json';
const pathSimilar  = '$/music/similar-artists.json';

const help = `Downloads a list of artists similar to the Artists JSON list.

Setup: Manually create the Config JSON file.
Setup: Manually create the Artists JSON file.

LastFM JSON Path: ${pathConfig}
LastFM JSON Type: $/types/LastFm.d.ts::LastFm.Config
Artists JSON Path: ${pathArtists}
Artists JSON Type: $/types/LastFm.d.ts::LastFm.JsonArtists
Output JSON Path: ${pathSimilar}
Output JSON Type: $/types/LastFm.d.ts::LastFm.JsonSimilarArtists`;

const main = async () => {
    const name = 'Music Similar Artists';
    const input = await getInput({ name, help, inScriptable: true });
    if (!input) { return; }

    const artistJson = await readJson(pathArtists);
    const artistObject = /** @type {LastFm.JsonArtists|null} */(artistJson);
    if (!artistObject) {
        return error('Music Similar Artists', `Read Error: ${pathArtists}`);
    }

    const configJson = (await readJson(pathConfig));
    const config = /** @type {LastFm.Config|null} */(configJson);
    const key = string(config?.key);
    if (!key) {
        return error('Music Similar Artists', `Read Error: ${pathConfig}`);
    }

    const artists = artistObject.artists || [];

    /** @type {LastFm.JsonSimilarArtists} */
    const output = { };

    for(let i=0; i < artists.length; i += 1) {
        const artist = artists[i];

        const url = 'https://ws.audioscrobbler.com/2.0/?' + encodeUriMap({
            method: 'artist.getsimilar',
            artist: artist,
            api_key: key,
            format: 'json'
        });

        const respJson = await downloadJson(url);
        const resp = /** @type {LastFm.Response|null} */(respJson);
        if (resp && resp.similarartists) {
            output[artist] = resp.similarartists.artist;
        }

        status('Progress: ' + Math.round(i / artists.length * 100) + '%');
    }

    log('Done downloading similar artists.');
    writeJson(pathSimilar, output);
};

main();
