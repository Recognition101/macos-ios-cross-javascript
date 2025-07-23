export type Config = {
    year: number;
    ignoredConferenceTitles: string[];
};

export type GameMetadata = {
    conferences: Set<string>;
    media: Set<string>;
};

/** https://2025.gamesrecap.io/api/data */
export type Api = {
    games: ApiGame[];
    conferences: ApiConference[];
};

export type ApiGame = {
    order: null;
    customDate: string;
    conference: ApiConference;
    coop: boolean;
    date: string;
    dlc: boolean;
    ea: boolean;
    exclusive: boolean;
    f2p: boolean;
    gameUpdate: boolean;
    mp: boolean;
    sp: boolean;
    gp: boolean;
    demo: boolean;
    crossplay: boolean;
    remaster: boolean;
    release: number[],
    _id: string;
    title: string;
    developer: string;
    developerLink: string;
    genre: string;
    info: string;
    dateDisplay: boolean;
    media: ApiMedia[];
    affiliates: [];
    createdAt: string;
    updatedAt: string;
    __v: 0
};

export type ApiMedia = {
    type: string;
    _id: string;
    link: string;
};

export type ApiConference = {
    start_time: string;
    end_time: string;
    _id: string;
    title: string;
    createdAt: string;
    updatedAt: string;
    __v: number;
};
