// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-blue; icon-glyph: flask;

// @ts-ignore
// eslint-disable-next-line
try { require; } catch(e) { require = importModule; }

const {
    getInput, readJson, error, output, sendRequest, writeJson, string
} = require('./lib/lib.js');

/**
 * @typedef {import('./types/plex').PlexLogin} PlexLogin
 * @typedef {import('./types/plex').PlexApiResponse} PlexApiResponse
 * @typedef {import('./types/plex').PlexApiMetadata} PlexApiMetadata
 * @typedef {import('./types/plex').PlexApiMetadataFilter} PlexApiMetadataFilter
 */

const pathLogin = '$/plex/plex-login.json';
const urlParser = /^[^:]*:\/\/((?:\[[^\]]*\])|[^:/]+)(?::(\d+))?/;

const help = `Starts playing a frinkiac clip.

Setup: Manually create Plex Login JSON (requires 'playbackTargetName' property)

Plex Login JSON Path: ${pathLogin}
Plex Login JSON Type: $/types/plex.ts::PlexLogin`;

/**
 * @param {string} api the API name to call
 * @param {PlexLogin} config the configuration object
 * @param {Object<string, string>} [headers] optional headers to send
 * @param {'GET'|'POST'} [verb] the HTTP verb to use
 * @return {Promise<any>} the parsed object (if it could be parsed)
 */
const callApi = async (api, config, headers, verb) => {
    const token = `X-Plex-Token=${config.token}`;
    const separator = api.includes("?") ? "&" : "?";
    const url = `${config.server}/${api}${separator}${token}`;
    const response = await sendRequest(
        url,
        headers || { 'Accept': 'application/json' },
        undefined,
        verb || 'GET'
    );

    try {
        return JSON.parse(response);
    } catch(e) {
        throw new Error(`Plex API Call Failure: url=${url}`);
    }
};

/**
 * Gets the metadata for a nested item by recursively calling the API.
 * @param {PlexApiMetadataFilter[]} filters constraints on each level
 * @param {PlexLogin} config the configuration to make API calls
 * @param {PlexApiResponse|null} [response] the response to look within
 * @return {Promise<PlexApiMetadata|null>} the found item, if one was found
 */
const getMetadata = async (filters, config, response) => {
    if (!response) {
        /** @type {PlexApiResponse|null} */
        const sectionResponse = await callApi('library/sections', config);
        const sectionDir = sectionResponse?.MediaContainer.Directory ?? [];
        const sectionIds = sectionDir.map(x => x.key);
        for(const sectionId of sectionIds) {
            const sectionApi = `library/sections/${sectionId}/all`;
            /** @type {PlexApiResponse} */
            const section = await callApi(sectionApi, config);
            const result = await getMetadata(filters, config, section);
            if (result) {
                return result;
            }
        }
        return null;
    }

    const filter = filters.at(0);
    if (!filter) {
        return null;
    }
    const nextFilters = filters.slice(1);

    for(const meta of response.MediaContainer.Metadata) {
        const isMatch = (
            (filter.title === undefined || filter.title === meta.title)
            && (filter.type === undefined || filter.type === meta.type)
            && (filter.index === undefined || filter.index === meta.index)
        );
        if (isMatch && nextFilters.length > 0) {
            const apiKey = (meta.key || '').replace(/^\//, '');
            /** @type {PlexApiResponse|null} */
            const child = await callApi(apiKey, config);
            if (child) {
                return getMetadata(nextFilters, config, child);
            }
        } else if (isMatch) {
            return meta;
        }
    }

    return null;
}

const main = async () => {
    const input = await getInput({
        name: 'Plex Frinkiac',
        help,
        inScriptable: true,
        args: [{
            name: 'url',
            shortName: 'u',
            help: 'The Frinkiac URL to play.',
            type: 'string',
            share: true
        }]
    });
    if (!input) { return; }

    const url = string(input.url);
    const urlMatches = url.match(/.*S(\d+)E(\d+)\/(\d+)$/);
    const season = Number(urlMatches?.[1]) || 1;
    const episode = Number(urlMatches?.[2]) || 1;
    const time = Number(urlMatches?.[3]) || 0;

    const config = /** @type {PlexLogin|null} */(await readJson(pathLogin));
    if (!config) {
        return error('Plex Get Library', `Could not read: ${pathLogin}`);
    }

    const clientId = Math.random().toString();
    const clientName = config.playbackTargetName;
    if (!clientName) {
        return error('Plex Frinkiac', 'Config missing `playbackTargetName`.');
    }

    const serverMatch = config.server.match(urlParser);
    const serverHost = serverMatch?.[1] ?? '';
    const serverPort = serverMatch?.[2] ?? '';
    if (!serverHost || !serverPort) {
        return error(
            'Plex Frinkiac',
            `Could not parse host/port from: ${config.server}`
        );
    }

    /** @type {PlexApiResponse} */
    const midResponse = await callApi('identity', config);
    const serverMid = midResponse?.MediaContainer?.machineIdentifier;
    if (!serverMid) {
        return error('Plex Frinkiac',  'Cloud not get server MID.');
    }

    /** @type {PlexApiMetadataFilter[]} */
    const filters = [
        { title: 'The Simpsons', type: 'show' },
        { index: season, type: 'season' },
        { index: episode, type: 'episode' }
    ];
    const metadata = await getMetadata(filters, config);
    if (!metadata) {
        return error('Plex Frinkiac', 'Could not find episode.');
    }

    /** @type {PlexApiResponse} */
    const clients = await callApi('clients', config);
    const clientList = clients.MediaContainer.Server;
    const client = clientList?.find(x => x.name === clientName);
    if (!client) {
        return error(
            'Plex Frinkiac',
            `No client named "${clientName}". On the client, ` +
            `try Settings -> Advertise as Player ` +
            `(Set to Off, then On).`
        );
    }

    const queueApiUrl = 'playQueues' +
        '?continuous=0' +
        '&includeChapters=1' +
        '&includeRelated=1' +
        '&repeat=0' +
        '&shuffle=0' +
        '&type=video' +
        `&uri=server%3A%2F%2F${serverMid}%2Fcom.plexapp.plugins.library` +
        `%2Flibrary%2Fmetadata%2F${metadata.ratingKey}`;

    /** @type {PlexApiResponse} */
    const resp = await callApi(queueApiUrl, config, {
        'X-Plex-Token': config.token,
        'X-Plex-Client-Identifier': clientId,
        'Accept': 'application/json' 
    }, 'POST');

    const pqId = resp.MediaContainer.playQueueID ?? 0;

    const playUrl = `http://${client.address}:${client.port}/player/playback/playMedia` +
        `?address=${serverHost}` +
        `&commandID=1` +
        `&containerKey=%2FplayQueues%2F${pqId}%3Fwindow%3D100%26own%3D1` +
        `&key=%2Flibrary%2Fmetadata%2F${metadata.ratingKey}` +
        `&machineIdentifier=${serverMid}` +
        `&offset=${time}` +
        `&port=${serverPort}` +
        `&protocol=http&providerIdentifier=com.plexapp.plugins.library` +
        `&token=${config.token}` +
        `&type=video`;

    await sendRequest(
        playUrl,
        {
            'X-Plex-Client-Identifier': clientId,
            'X-Plex-Target-Client-Identifier': client.machineIdentifier
        },
        undefined,
        'GET'
    );
      
    output('Plex Frinkiac', 'Play Request Sent.');
};

main();
