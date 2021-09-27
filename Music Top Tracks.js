// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: yellow; icon-glyph: music; share-sheet-inputs: url;

///<reference path="./types/LastFm.d.ts" />
// @ts-ignore
// eslint-disable-next-line
try { require; } catch(e) { require = () => importModule('lib/scriptable'); }

const {
    getInput, downloadJson, readJson, writeJson,
    error, log, status, encodeURIComponent, string
} = require('./lib/node.js');

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
const pathTop  = '$/music/top-tracks.json';

const help = `Gets a list of top tracks by the artists in the Artists JSON.

Setup: Manually create the LastFM JSON file.
Setup: Manually create the Artists JSON file.

LastFM JSON Path: ${pathConfig}
LastFM JSON Type: $/types/LastFm.d.ts::LastFm.Config
Artists JSON Path: ${pathArtists}
Artists JSON Type: $/types/LastFm.d.ts::LastFm.JsonArtists
Output JSON Path: ${pathTop}
Output JSON Type: $/types/LastFm.d.ts::LastFm.JsonTopTracks`;

const main = async () => {
    const input = await getInput({ help, inScriptable: true, args: [ ] });
    if (!input) { return; }

    const artistsJson = await readJson(pathArtists);
    const artistObject = /** @type {LastFm.JsonArtists|null} */(artistsJson);
    if (!artistObject) {
        return error('Music Top Tracks', `Read Error: ${pathArtists}`);
    }

    const configJson = (await readJson(pathConfig));
    const config = /** @type {LastFm.Config|null} */(configJson);
    const key = string(config?.key);
    if (!key) {
        return error('Music Similar Artists', `Read Error: ${pathConfig}`);
    }

    const artists = artistObject.artists || [];

    /** @type {LastFm.JsonTopTracks} */
    const output = { };

    for(let i=0; i < artists.length; i += 1) {
        const artist = artists[i];

        const url = 'https://ws.audioscrobbler.com/2.0/?' + encodeUriMap({
            method: 'artist.gettoptracks',
            artist: artist,
            api_key: key,
            format: 'json'
        });

        /** @type {LastFm.Response|null} */
        const resp = await downloadJson(url);
        if (resp && resp.toptracks) {
            output[artist] = resp.toptracks.track;
        }

        status('Progress: ' + Math.round(i / artists.length * 100) + '%');
    }

    log('Done downloading top tracks.');

    writeJson(pathTop, output);
};

main();
