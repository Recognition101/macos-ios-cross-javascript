declare namespace Music {
    interface ArtistCache {
        [matchName: string]: Song[];
    }

    interface Song {
        name: string;
        artist: string;
        album: string;
        path: string;
    }

    interface TopSong extends Song {
        playCount: number;
        listeners: number;
    }

    interface ArtistMatch {
        from: string;
        to: string;
        score: number;
    }
}
