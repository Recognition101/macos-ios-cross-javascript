interface LifeLog {
    /** The next ID value to use in the `idMap`. */
    nextId: number;
    /** Maps activity keys to ID values used in `log` and `finish`. */
    idMap: { [activityKey: string]: number };
    /** A set of activity keys for activities that are "ongoing". */
    active: string[];
    /** Maps timestamps (ms since epoch) to activity IDs logged then. */
    log: { [timestamp: string]: number };
    /** Maps timestamps (ms since epoch) to activity IDs finished then. */
    finish: { [timestamp: string]: number };
}

/** A map of activity keys to metadata further describing each activity. */
interface LifeLogActivities {
    [activityKey: string]: LifeLogActivity;
}

type LifeLogTypeList = [ 'movie', 'tv', 'book', 'game' ];
type LifeLogType = LifeLogTypeList[number];

/** Metadata describing each activity. */
interface LifeLogActivity {
    key: string;
    /** The main category this activity falls into. */
    type: LifeLogType;
    /** A sub category, ex: movie year, book author, game system, etc. */
    subType: string;
    /** The human-readable activity name. */
    name: string;
    /** The time (ms since epoch) that this activity was created. */
    timeCreated: number;
}

/** A helper type for passing sortable lists of activity keys. */
interface LifeLogActivitySummary {
    title: string;
    key: string;
    time: number;
}

/** A helper type containing metadata about a URL parsed into an activity. */
interface LifeLogUrlKey {
    /** The activity key for the parsed URL. */
    key: string;
    /** The type of the parsed URL (used as `LifeLogActivity.subType`). */
    urlType?: 'steam' | 'pico8' | 'apple' | 'itch' | 'playdate';
    /** The unique identifier string present in the parsed URL. */
    urlId?: string;
}

/** A helper type describing a minimum and a maximum numeric value. */
interface LifeLogBounds { min: number; max: number; }
