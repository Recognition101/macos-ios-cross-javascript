declare namespace LastFm {
    interface Config {
        /** The default username to look up data from. */
        username: string;

        /** The API key used to query the LastFM API. */
        key: string;
    }

    /** Defines the output JSON for the "LastFM History" script. */
    interface JsonTracks {
        tracks: JsonTrack[];
    }

    interface JsonTrack {
        name: string;
        album: string;
        artist: string;
        timestamp: number;
        time: string;
    }

    /** Defines the type that the Artists JSON file needs to use. */
    interface JsonArtists {
        artists: string[];
    }

    /** The result JSON type of the "Music Similar Artists" script. */
    interface JsonSimilarArtists {
        [artist: string]: ArtistMatch[];
    }

    /** The result JSON type of the "Music Top Tracks" script. */
    interface JsonTopTracks {
        [artist: string]: Track[];
    }

    interface ArtistNode {
        name: string;
        '#text': string;
        mbid: string;
        url: string;
    }

    interface ArtistMatch extends LastFm.ArtistNode {
        match: string;
        image: LastFm.ImageNode[];
        streamable: string;
    }

    interface TextNode {
        '#text': string;
        mbid: string;
    }

    interface ImageNode {
        '#text': string;
        size: 'small' | 'medium' | 'large' | 'extralarge' | 'mega' | '';
    }

    interface Track {
        name: string;
        url: string;
        playcount: string;
        listeners: string;
        streamable: string;
        mbid: string;
        date?: {
            uts: string,
            '#text': string
        }
        album: LastFm.TextNode;
        artist: LastFm.ArtistNode;
        image: LastFm.ImageNode[];
    }

    interface TrackResponse {
        '@attr': {
            page: string;
            total: string;
            user: string;
            perPage: string;
            totalPages: string;
        };

        track: LastFm.Track[];
    }

    interface ArtistResponse {
        '@attr': {
            artist: string;
        };
        artist: ArtistMatch[];
    }

    interface Response {
        recenttracks?: LastFm.TrackResponse;
        toptracks?: LastFm.TrackResponse;
        similarartists?: LastFm.ArtistResponse;
    }
}
