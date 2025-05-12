// Plex Login

export type PlexLogin = {
    /**
     * The server's address (not including the final slash).
     * ex: "http://192.168.1.123:32400".
     */
    server: string;
    /**
     * The plex token to make API calls, ex: "Vs9nY2sb7siegh0lt8xc".
     * To find it:
     * 1. Log onto the Plex Web app in a desktop browser.
     * 2. On a movie / tv show, click "...", then "Get Info"
     * 3. On the info popup, click "View XML" in the bottom left.
     * 4. In the URL for the opened page, look for `X-Plex-Token=<TOKEN>`.
     * @see https://support.plex.tv/articles/204059436-finding-an-authentication-token-x-plex-token/
     */
    token: string;
    /**
     * The device name of the device that scripts will play media on.
     * Only used by scripts that start playing media on a specific device.
     * The "Plex Get Library" script does not use this. After running
     * "Plex Get Library", the resulting `plex-library.json` file will
     * contain a list of all device names - putting one of those in as this
     * property will allow other scripts to play content to that
     * specific device.
     */
    playbackTargetName?: string;
};

// Plex Library

export type PlexLibrary = {
    sections: string[];
    devices: PlexApiDevice[];
    movies: PlexLibraryMovie[];
    tvShows: PlexLibraryMeta[];
};

export type PlexLibraryMovie = {
    title: string;
    rid: string;
    guid: string;
};

export type PlexLibraryMeta = PlexLibraryMovie & {
    index: number;
    children: PlexLibraryMeta[];
};

export type PlexLibraryContainer = {
    type: PlexApiMetadata['type'];
    dir: PlexLibraryMeta;
}

// Plex API

export type PlexApiResponse = {
    MediaContainer: PlexApiMediaContainer;
};

export type PlexApiMediaContainer = {
    Directory: PlexApiDirectory[];
    Metadata: PlexApiMetadata[];
    Device: PlexApiDevice[];

    size?: number;
    Server?: PlexApiServer[];
    machineIdentifier?: string;

    playQueueID?: number;
    playQueueSelectedItemID?: number;
    playQueueSelectedItemOffset?: number;
    playQueueSelectedMetadataItemID?: string;
    playQueueShuffled?: boolean;
    playQueueSourceURI?: string;
    playQueueTotalCount?: number;
    playQueueVersion?: number;
};

export type PlexApiServer = {
    name: string;
    host: string;
    address: string;
    port: number;
    machineIdentifier: string;
    version: string;
    protocol: string;
    product: string;
    deviceClass: string;
    protocolVersion: string;
    protocolCapabilities: string;
};

export type PlexApiDirectory = {
    key: string;
    title: string;
    Location: PlexApiLocation[];
};

export type PlexApiLocation = {
    id: string;
    path: string;
};

export type PlexApiMetadata = {
    guid: string;
    ratingKey: string;
    /** API URL to get more metadata. */
    key: string;
    title: string;
    index: number;
    type: 'movie' | 'show' | 'season' | 'episode';
};

export type PlexApiDevice = {
    id: number;
    name: string;
    platform: string;
    clientIdentifier: string;
    createdAt: number;
};

// Frinkiac Types

export type PlexApiMetadataFilter = {
    title?: string;
    index?: number;
    type?: PlexApiMetadata['type'];
};

