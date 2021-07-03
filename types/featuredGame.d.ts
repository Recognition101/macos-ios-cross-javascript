type FeaturedGames = {
    [id: string]: FeaturedGame;
};

interface FeaturedGame {
    name: string;
    phone?: boolean;
    pad?: boolean;
    tv?: boolean;
    cloud?: boolean;
    mfi?: boolean;
    ends?: boolean;
    map?: boolean;
    multi?: boolean;
}
