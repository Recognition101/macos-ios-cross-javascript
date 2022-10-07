// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: yellow; icon-glyph: music;

///<reference path="./types/music.d.ts" />
// @ts-ignore
// eslint-disable-next-line
try { require; } catch(e) { require = importModule; }

const {
    getInput, string, readJson, writeJson, error, output, writeText,
    listFiles, pathJoin, isDirectory, makeDirectory
} = require('./lib/lib.js');

const pathTop  = '$/music/top-tracks.json';
const pathSimilar  = '$/music/similar-artists.json';
const pathArtistCache = '$/music/artist-cache.json';

const help = `Creates playlists based on the Music Similar Artists JSON and the
Music Top Tracks JSON. The playlists will be populated with references to MP3
files from a given Working Directory (WD), organized in this structure:

    WD / Artist Name / Album Name (Year) / TrackNumber - Song.mp3

Setup: Run "Music Similar Artists" to create the Similar Artists JSON
Setup: Run "Music Top Tracks" to create the Top Tracks JSON

Similar Artists JSON Path: ${pathSimilar}
Similar Artists JSON Type: $/types/LastFm.d.ts::LastFm.JsonSimilarArtists
Top Tracks JSON Path: ${pathTop}
Top Tracks JSON Type: $/types/LastFm.d.ts::LastFm.JsonTopTracks
Artist Cache JSON Path: ${pathArtistCache}
Artist Cache JSON Type: $/types/Music.d.ts::ArtistCache`;

const fileTypes = [ '.mp3' ];
const recencyInit = 1.0;
const recencyDecay = 0.2;

/**
 * Gets a simplified name to match against.
 * @param {string} name the name to simplify
 * @return {string} the simplified name
 */
const getMatchName = name => name.toLocaleLowerCase().trim().replace(/\W/g, '');

/**
 * Scans a directory structure of the form:
 *     WD / Artist Name / Album Name (Year) / TrackNumber - Song.mp3
 * Returns a map of artist match names to all songs by that artist.
 * @param {string} pathRoot the path to the WD folder.
 * @param {Music.ArtistCache|null} cache an optional cache to read from
 * @return {Promise<Map<string, Music.Song[]>>} the artist map
 */
const getArtists = async (pathRoot, cache) => {
    /** @type {Map<string, Music.Song[]>} */
    const artists = new Map();

    if (cache) {
        for(const [ artistName, songs ] of Object.entries(cache)) {
            artists.set(artistName, songs);
        }
        return artists;
    }

    for(const artist of await listFiles(pathRoot)) {
        const pathArtist = pathJoin(pathRoot, artist);
        const matchArtist = getMatchName(artist);
        const albums = await isDirectory(pathArtist)
            ? await listFiles(pathArtist)
            : [ ];

        for(const album of albums) {
            const pathAlbum = pathJoin(pathArtist, album);
            const songNames = await isDirectory(pathAlbum)
                ? await listFiles(pathAlbum)
                : [ ];

            for(const songName of songNames) {
                const type = fileTypes.find(t => songName.endsWith(t));
                if (type) {
                    const path = pathJoin(artist, album, songName);
                    const name = songName
                        .substring(0, songName.length - type.length)
                        .replace(/^[ \d]+\s+(-\s+)?/, '');

                    const songList = artists.get(matchArtist) ?? [ ];
                    songList.push({ artist, name, album, path });
                    artists.set(matchArtist, songList);
                }
            }
        }
    }

    return artists;
};

/**
 * @param {Music.Song} song the song to get top data for
 * @param {string} matchArtist the artist name (in match form)
 * @param {LastFm.JsonTopTracks} top the top data to merge with
 * @return {Music.TopSong|null} the merged song data, or null if no data
 */
const getTopSong = (song, matchArtist, top) => {
    const matchName = getMatchName(song.name);
    const topData = top[matchArtist]?.find(
        x => getMatchName(x.name) === matchName
    );

    if (topData) {
        const playCount = parseInt(topData.playcount, 10);
        const listeners = parseInt(topData.listeners, 10);
        return { ...song, playCount, listeners };
    }

    return null;
};

/**
 * Creates a map of artists to songs + top metadata.
 * @param {Map<string, Music.Song[]>} artists the artist map to augment
 * @param {LastFm.JsonTopTracks} top the top metadata to augment with
 * @param {'playCount'|'listeners'} popularity the type of popularity to sort by
 * @return {Map<string, Music.TopSong[]>} the top songs + top metadata
 */
const getTopArtists = (artists, top, popularity) => {
    /** @type {Map<string, Music.TopSong[]>} */
    const topArtists = new Map();
    for(const [ matchArtist, songs ] of artists.entries()) {
        /** @type {Music.TopSong[]} */
        const topSongs = [ ];
        for(const song of songs) {
            const topSong = getTopSong(song, matchArtist, top);
            if (topSong) {
                topSongs.push(topSong);
            }
        }
        topSongs.sort((a, b) => popularity === 'playCount'
            ? b.playCount - a.playCount
            : b.listeners - a.listeners
        );
        topArtists.set(matchArtist, topSongs);
    }

    return topArtists;
};

/**
 * Gets a map of artists we have to similar artists we have.
 * @param {Map<string, Music.Song[]>} artists the artists we are analyzing
 * @param {LastFm.JsonSimilarArtists} similar the LastFM similarity data
 * @return {Map<string, Music.ArtistMatch[]>} map of artist to similar ones
 */
const getMatches = (artists, similar) => {
    /** @type {Map<string, Music.ArtistMatch[]>} */
    const matches = new Map();
    for(const [artist, similarArtists] of Object.entries(similar)) {
        const from = getMatchName(artist);
        if (artists.has(from)) {
            const matchList = matches.get(from) ?? [ ];
            matches.set(from, matchList);

            for(const similarArtist of similarArtists) {
                const to = getMatchName(similarArtist.name);
                if (artists.has(to)) {
                    const score = parseFloat(similarArtist.match);
                    matchList.push({ from, to, score });
                }
            }
        }
    }

    return matches;
};

/**
 * Adds an artist to the recency map, decaying all others.
 * @param {Map<string, number>} recency the recency map to edit
 * @param {string} artistName the new artist to add
 */
const addToRecency = (recency, artistName) => {
    for(const [ recentArtist, score ] of recency.entries()) {
        const newScore = score - recencyDecay;
        if (newScore > 0) {
            recency.set(recentArtist, newScore);
        } else {
            recency.delete(recentArtist);
        }
    }

    recency.set(artistName, recencyInit);
};

/**
 * Makes a similarity playlist for a particular artist.
 * @param {Map<string, Music.Song[]>} artists the artists we are analyzing
 * @param {LastFm.JsonTopTracks} top the top data (match-named)
 * @param {'playCount'|'listeners'} popularity the type of popularity to sort by
 * @param {LastFm.JsonSimilarArtists} similar the similarity data to use
 * @param {string} pathPlaylist the path to the playlist directory
 * @param {string} artist the (match-named) artist to start with
 * @return {Promise<void>} a promise resolving upon completion
 */
const writeSimilarPlaylist = async (
    artists,
    top,
    popularity,
    similar,
    pathPlaylist,
    artist
) => {
    const maxArtistCount = 10;
    const maxSimilarArtists = 5;

    const topArtists = getTopArtists(artists, top, popularity);
    const matches = getMatches(artists, similar);

    /** @type {Map<string, number>} */
    const artistCounts = new Map();
    /** @type {Map<string, number>} */
    const recency = new Map();
    /** @type {Music.TopSong[]} */
    const playlist = [ ];

    /**
     * @param {string} matchArtist the artist to add from
     * @param {boolean} [isSingleSong] if true, only add 1 song
     * @return {boolean} true if we added a song, false otherwise
     */
    const addSong = (matchArtist, isSingleSong) => {
        const artistCount = artistCounts.get(matchArtist) ?? 0;
        if (artistCount >= maxArtistCount) {
            return false;
        }

        const song = topArtists.get(matchArtist)?.shift();
        if (!song) {
            return false;
        }

        artistCounts.set(matchArtist, artistCount + 1);
        playlist.push(song);
        addToRecency(recency, matchArtist);
        if (isSingleSong) {
            return true;
        }

        const matchList = (matches.get(matchArtist) ?? [ ]).map(x => ({
            from: x.from,
            to: x.to,
            score: x.score - (recency.get(x.to) ?? 0)
        }));

        matchList.sort((a, b) => b.score - a.score);

        for(const match of matchList.slice(0, maxSimilarArtists)) {
            addSong(match.to);
            const didAddSelf = addSong(matchArtist, true);
            if (!didAddSelf) {
                break;
            }
        }

        return true;
    };

    addSong(artist);

    await writeText(
        pathJoin(pathPlaylist, `similar-${artist}.m3u`),
        playlist.map(song => '../' + song.path).join('\n')
    );
};

/**
 * Makes a cluster playlist for a particular artist.
 * @param {Map<string, Music.Song[]>} artists the artists we are analyzing
 * @param {LastFm.JsonTopTracks} top the top data (match-named)
 * @param {'playCount'|'listeners'} popularity the type of popularity to sort by
 * @param {LastFm.JsonSimilarArtists} similar the similarity data to use
 * @param {string} pathPlaylist the path to the playlist directory
 * @param {string} artist the (match-named) artist to start with
 * @return {Promise<void>} a promise resolving upon completion
 */
const writeClusterPlaylist = async (
    artists,
    top,
    popularity,
    similar,
    pathPlaylist,
    artist
) => {
    const minScoreInit = 1.0;
    const minScoreDecay = 0.01;
    const minScoreDistance = 0.2;

    const artistsPerCluster = 4;
    const songsPerArtist = 10;

    const topArtists = getTopArtists(artists, top, popularity);
    const matches = getMatches(artists, similar);

    /** @type {Set<string>} */
    const playlistArtists = new Set();
    /** @type {Music.TopSong[]} */
    const playlist = [ ];

    /**
     * @param {string} matchArtist the artist to base the cluster on
     * @param {number} minScore the cluster edges have at least this value
     * @param {Set<string>} [cluster] the cluster to add to
     * @return {Set<string>} the cluster
     */
    const getCluster = (matchArtist, minScore, cluster) => {
        cluster = cluster || new Set();
        cluster.add(matchArtist);

        for(const match of matches.get(matchArtist) ?? [ ]) {
            const doAdd =
                match.score > minScore &&
                !cluster.has(match.to) &&
                !playlistArtists.has(match.to);
            if (doAdd) {
                getCluster(match.to, minScore + minScoreDistance, cluster);
            }
        }

        return cluster;
    };

    /**
     * @param {string} matchArtist the artist to base the cluster on
     * @return {boolean} true if a new cluster was added, false otherwise
     */
    const addCluster = (matchArtist) => {
        // Find the cluster with the highest minimum score
        let minScore = minScoreInit;
        let cluster = getCluster(matchArtist, minScore);
        while(cluster.size < artistsPerCluster && minScore > 0) {
            minScore -= minScoreDecay;
            cluster = getCluster(matchArtist, minScore);
        }

        // If no cluster found, exit
        if (cluster.size < artistsPerCluster) {
            return false;
        }

        // Add songs from all artists in the cluster
        for(let i = 0; i < songsPerArtist; i += 1) {
            for(const artist of cluster) {
                const song = topArtists.get(artist)?.shift();
                if (song) {
                    playlist.push(song);
                }
            }
        }

        // Note visited artists
        for(const artist of cluster) {
            playlistArtists.add(artist);
        }

        // Find next artist
        const next = Array.from(cluster).flatMap(artist =>
            matches.get(artist)?.map(match => match.to) ?? [ ]
        );
        next.find(x => !playlistArtists.has(x) && addCluster(x));

        return true;
    };

    addCluster(artist);

    await writeText(
        pathJoin(pathPlaylist, `cluster-${artist}.m3u`),
        playlist.map(song => '../' + song.path).join('\n')
    );
};

const main = async () => {
    const input = await getInput({
        name: 'Music Playlists',
        help,
        inScriptable: true,
        args: [ {
            name: 'folder',
            shortName: 'f',
            help: 'The path to the Working Directory to scan for MP3 files.',
            type: 'pathFolder',
            bookmarkName: 'music-playlists-root'
        }, {
            name: 'type',
            shortName: 't',
            help: 'The type of playlist to create (default: top).',
            type: 'enum',
            choices: [
                { title: 'Top Of All', code: 'top' },
                { title: 'Similar', code: 'similar' },
                { title: 'Similarity Clusters', code: 'cluster' }
            ]
        }, {
            name: 'artist',
            shortName: 'a',
            help: 'Comma-separated artist list to start with for some types.',
            type: 'string'
        }, {
            name: 'popularity',
            shortName: 'p',
            help: 'Popularity comparison metric (default: playCount).',
            type: 'enum',
            choices: [
                { title: 'Play Count', code: 'playCount' },
                { title: 'Listener Count', code: 'listeners' }
            ]
        }, {
            name: 'writeCache',
            shortName: 'w',
            help: 'If given, write the artist/song map to the cache.',
            type: 'boolean'
        }, {
            name: 'readCache',
            shortName: 'r',
            help: 'If given, read the artist/song map from the cache.',
            type: 'boolean'
        } ]
    });
    if (!input) { return; }

    const topJson = await readJson(pathTop);
    const top = /** @type {LastFm.JsonTopTracks|null} */(topJson);
    const similarJson = await readJson(pathSimilar);
    const similar = /** @type {LastFm.JsonSimilarArtists|null} */(similarJson);
    const pathRoot = string(input['folder']);
    const pathPlaylist = pathJoin(pathRoot, '_playlists');
    const popularity = input['popularity'] === 'listeners'
        ? 'listeners'
        : 'playCount';
    const inputArtists = string(input['artist']);
    const type = string(input['type']) || 'top';

    if (!top || !similar || !pathRoot) {
        return error('Music Playlists',
            !top ? `Read Error: ${pathTop}` :
            !similar ? `Read Error: ${pathSimilar}` :
            'Error: Missing folder.');
    }

    await makeDirectory(pathPlaylist);

    /** @type {LastFm.JsonTopTracks} */
    const matchTop = { };
    for(const [ artist, topInfo ] of Object.entries(top)) {
        matchTop[getMatchName(artist)] = topInfo;
    }

    const artistsCache = input['readCache']
        ? /** @type {Music.ArtistCache|null} */(await readJson(pathArtistCache))
        : null;

    const artists = await getArtists(pathRoot, artistsCache);

    if (input['writeCache']) {
        /** @type {Music.ArtistCache} */
        const cache = { };
        for(const [ artist, songs ] of artists.entries()) {
            cache[artist] = songs;
        }
        await writeJson(pathArtistCache, cache);
    }

    if (type === 'top') {
        /** @type {Music.TopSong[]} */
        const playlist = [ ];

        /** @type {Map<string, number>} */
        const playlistArtists = new Map();

        /** @type {Music.TopSong[]} */
        const topSongs = [ ];
        for(const [ matchArtist, songs ] of artists.entries()) {
            for(const song of songs) {
                const topSong = getTopSong(song, matchArtist, matchTop);
                if (topSong) {
                    topSongs.push(topSong);
                }
            }
        }

        topSongs.sort((a, b) => popularity === 'playCount'
            ? b.playCount - a.playCount
            : b.listeners - a.listeners
        );

        const maxCount = 6;
        for(const [i, song] of topSongs.entries()) {
            const max = maxCount - Math.floor(i / topSongs.length * maxCount);
            const artistCount = playlistArtists.get(song.artist) ?? 0;
            if (artistCount < max) {
                playlist.push(song);
                playlistArtists.set(song.artist, artistCount + 1);
            }
        }

        await writeText(
            pathJoin(pathPlaylist, `top-${popularity}.m3u`),
            playlist.map(song => '../' + song.path).join('\n')
        );
    }

    if (type === 'similar') {
        for(const artist of inputArtists.split(',')) {
            await writeSimilarPlaylist(
                artists,
                matchTop,
                popularity,
                similar,
                pathPlaylist,
                getMatchName(artist)
            );
        }
    }

    if (type === 'cluster') {
        for(const artist of inputArtists.split(',')) {
            await writeClusterPlaylist(
                artists,
                matchTop,
                popularity,
                similar,
                pathPlaylist,
                getMatchName(artist)
            );
        }
    }

    output('Music Playlists', 'Done creating playlists.');
};

main();
