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
