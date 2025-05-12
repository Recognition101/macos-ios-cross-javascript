// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: yellow; icon-glyph: film;

// @ts-ignore
// eslint-disable-next-line
try { require; } catch(e) { require = importModule; }

const {
    getInput, readJson, error, output, sendRequest, writeJson
} = require('./lib/lib.js');

/**
 * @typedef {import('./types/plex').PlexLogin} PlexLogin
 * @typedef {import('./types/plex').PlexApiResponse} PlexApiResponse
 * @typedef {import('./types/plex').PlexLibrary} PlexLibrary
 * @typedef {import('./types/plex').PlexLibraryMeta} PlexLibraryMeta
 * @typedef {import('./types/plex').PlexLibraryContainer} PlexLibraryContainer
 */

const pathLogin  = '$/plex/plex-login.json';
const pathLibrary  = '$/plex/plex-library.json';

const help = `Downloads plex library metadata used by other scripts.

Setup: Manually create the Plex Login JSON

Plex Login JSON Path: ${pathLogin}
Plex Login JSON Type: $/types/plex.ts::PlexLogin
Plex Library JSON Path: ${pathLibrary}
Plex Library JSON Type: $/types/plex.ts::PlexLibrary`;

/**
 * @param {string} api the API name to call
 * @param {PlexLogin} config the configuration object
 * @return {Promise<any>} the parsed object (if it could be parsed)
 */
const callApi = async (api, config) => {
    const token = `X-Plex-Token=${config.token}`;

    const separator = api.includes("?") ? "&" : "?";

    const response = await sendRequest(
        `${config.server}/${api}${separator}${token}`,
        { 'Accept': 'application/json' },
        undefined,
        'GET'
    );

    try { return JSON.parse(response); } catch(e) { }
    return null;
};

/**
 * Stores the results of an API call into a media library (and recurses).
 * @param {PlexLibrary} media the media library to write into
 * @param {PlexApiResponse} result the API response to store
 * @param {PlexLogin} config API call information
 * @param {PlexLibraryContainer} [container] the folder to add to (if in one)
 */
const storeMedia = async (media, result, config, container) => {
    for(const meta of result.MediaContainer.Metadata) {
        const { title, guid, ratingKey: rid, index, type, key } = meta;
        const apiKey = (key || '').replace(/^\//, '');
        const isSeason = type === 'season';
        const isEpisode = type === 'episode';
        
        if (type === 'movie') {
            media.movies.push({ title, rid, guid });
        }

        if (type === 'show' || (isSeason && container?.type === 'show')) {
            /** @type {PlexLibraryMeta} */
            const dir = { title, rid, guid, index, children: [] };
            const child = await callApi(apiKey, config);
            if (child) {
                await storeMedia(media, child, config, { type, dir });
                (container?.dir.children ?? media.tvShows).push(dir);
            }
        }
        if (isEpisode && container && container?.type === 'season') {
            /** @type {PlexLibraryMeta} */
            const episode = { title, rid, guid, index, children: [] };
            container.dir.children.push(episode);
        }
    }
};

const main = async () => {
    const input = await getInput({
        name: 'Plex Get Library',
        help,
        inScriptable: true,
        args: []
    });
    if (!input) { return; }

    const config = /** @type {PlexLogin|null} */(await readJson(pathLogin));
    if (!config) {
        return error('Plex Get Library', `Could not read: ${pathLogin}`);
    }

    /** @type {PlexApiResponse|null} */
    const deviceResponse = await callApi('devices', config);
    if (!deviceResponse) {
        return error('Plex Get Library', 'Could not get: /devices');
    }

    /** @type {PlexApiResponse|null} */
    const sectionResponse = await callApi('library/sections', config);
    if (!sectionResponse) {
        return error('Plex Get Library', 'Could not get: /library/sections');
    }

    /** @type {PlexLibrary} */
    const result = {
        sections: sectionResponse.MediaContainer.Directory.map(x => x.key),
        devices: deviceResponse.MediaContainer.Device,
        movies: [],
        tvShows: []
    };

    for(const section of result.sections) {
        /** @type {PlexApiResponse} */
        const all = await callApi(`library/sections/${section}/all`, config);
        if (all) {
            await storeMedia(result, all, config);
        }
    }

    await writeJson(pathLibrary, result);
        
    output('Plex Get Library', 'Plex Library Saved.');
};

main();
