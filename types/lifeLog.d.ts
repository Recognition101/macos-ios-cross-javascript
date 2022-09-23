interface LifeLog {
    activities: LifeLogActivity[],
    log: { [timestamp: string]: number },
    finish: { [timestamp: string]: number }
}

type LifeLogTypeList = [
    'movie',
    'tv',
    'project',
    'book',
    'gamePc',
    'gameApple',
    'gameNintendo',
    'gamePico8'
];

type LifeLogType = LifeLogTypeList[number];

interface LifeLogActivity {
    id: number;
    name: string;
    type: LifeLogType;
    dateCreated: number;
    dateRecent: number;
    dateFinished?: number;
    url?: string;
    title?: string;
}
