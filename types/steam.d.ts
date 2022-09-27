declare namespace SteamData {
    interface Config {
        /** To get this, go to: https://steamcommunity.com/dev/apikey */
        apiKey: string;
        /** To get this, go to: https://www.steamidfinder.com */
        userId: string;
    }
    interface GamesResponse {
        response: {
            /** Number of games in this response. */
            game_count: number;
            /** Games in this response. */
            games: Game[];
        }
    }

    interface StatsResponse {
        playerstats: {
            /** The user's Steam ID whose stats this represents. */
            steamID: string;
            /** The human-readable name of this game. */
            gameName: string;
            /** A list of achievements this user has for this game. */
            achievements: Achievement[];
            /** True if this response was successfully returned. */
            success: boolean;
        }
    }

    type StoreItemResponse = {
        [gameId: string]: {
            success: boolean;
            data?: StoreItem;
        }
    };

    interface StoreItem {
        /** Ex: "game" */
        type: string;
        name: string;
        steam_appid: number;
        required_age: number;
        is_free: boolean;
        dlc: number[];
        detailed_description: string;
        about_the_game: string;
        short_description: string;
        supported_languages: string;
        reviews: string;
        /** A URL to the header image file. */
        header_image: string;
        /** The URL to the item's website. */
        website: string;
        pc_requirements: string[] | StoreItemRequirements;
        mac_requirements: string[] | StoreItemRequirements;
        linux_requirements: string[] | StoreItemRequirements;
        developers: string[];
        publishers: string[];
        demos: { appid: number; description: string; }[];
        price_overview: {
            /** The currency code, ex: "USD". */
            currency: string;
            /** The price, in the smallest denomination (ex: cents). */
            initial: number;
            /** The price, in the smallest denomination (ex: cents). */
            final: number;
            discount_percent: number;
            /** A formatted price, ex: "$14.99" */
            initial_formatted: string;
            /** A formatted price, ex: "$14.99" */
            final_formatted: string;
        };
        packages: number[];
        platforms: { windows: boolean; mac: boolean; linux: boolean; };
        metacritic: { score: number; url: string; };
        categories: StoreItemTag[];
        genres: StoreItemTag[];
        screenshots: StoreItemScreenshot[];
        movies: StoreItemMovie[];
        recommendations: { total: number; };
        achievements: { total: number; highlighted: StoreItemAchievement[]; };
        release_date: { coming_soon: boolean; date: string };
        support_info: { url: string; email: string; };
        /** The URL to the background. */
        background: string;
        /** The URL to the raw background. */
        background_raw: string;
    }

    interface StoreItemRequirements {
        minimum: string;
        recommended: string;
    }

    interface StoreItemTag {
        id: number;
        description: string;
    }

    interface StoreItemScreenshot {
        id: number;
        /** The URL to the thumbnail image. */
        path_thumbnail: string;
        /** The URL to the full image. */
        path_full: string;
    }

    interface StoreItemMovie {
        id: number;
        name: string;
        /** The URL to the thumbnail image. */
        thumbnail: string;
        webm: StoreItemMovieFile;
        mp4: StoreItemMovieFile;
        highlight: boolean;
    }

    interface StoreItemMovieFile {
        /** The URL to the smaller movie file. */
        "480": string;
        /** The URL to the full-resolution movie file. */
        max: string;
    }

    interface StoreItemAchievement {
        name: string;
        /** The URL to the icon for this achievement. */
        path: string;
    }

    interface Achievement {
        /** The ID this achievement has within this game. */
        apiname: string;
        /** The number 0 if not achieved, 1 if achieved. */
        achieved: 0 | 1;
        /** The Unix timestamp (in seconds) when this was achieved. */
        unlocktime: number;
        /** The human-readable name of this achievement. */
        name: string;
        /** The human-readable description of this achievement. */
        description: string;
    }

    interface Game {
        /** Steam App ID number. */
        appid: number;

        /** Human-readable name of the game. */
        name: string;

        /** Amount of time played, in minutes. */
        playtime_forever: number;

        /** Amount of time played (on Windows), in minutes. */
        playtime_windows_forever: number;

        /** Amount of time played (on Mac), in minutes. */
        playtime_mac_forever: number;

        /** Amount of time played (on Linux), in minutes. */
        playtime_linux_forever: number;

        /** The UUID used to create a URL to this game's icon image. */
        img_icon_url: string;

        /** The UUID used to create a URL to this game's logo image. */
        img_logo_url: string;

        /** The time (in seconds since the epoch) when this was last played. */
        rtime_last_played: number;
    }

    interface PlayedGame {
        /** Information describing the game itself. */
        game: Game;
        /** Information describing the user's game achievements. */
        achievements: Achievement[];
    }

    type UserData = {
        /** Game statistics for each played game. */
        games: PlayedGame[];
    }

    type Parameters = { [key: string]: string };
}
