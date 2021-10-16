declare namespace GameCenter {
    interface History {
        profile_privacy: string;
        games_state: GameState[];
    }

    interface GameState {
        game_name: string;
        leaderboard: LeaderBoardItem[];
        achievements: Achievement[];
        /** UTC date of last use, ex: "12/30/2020 17:01:01" */
        last_played_utc: string;
    }

    interface LeaderBoardItem {
        leaderboard_score: LeaderBoardScore[];
        leaderboard_title: string;
    }

    interface LeaderBoardScore {
        /** A UTC score submission time, ex: "12/30/2020 17:01:01" */
        submitted_time_utc: string;
        score: string;
        rank: number;
        time_scope: "ALLTIME" | "THISWEEK";
    }

    interface Achievement {
        /** A UTC last-updated time, ex: "12/30/2020 17:01:01" */
        last_update_utc: string;
        /** The amount complete as an integer within [0, 100]. */
        percentage_complete: number;
        /** The name of the achievement. */
        achievements_title: string;
    }
}
