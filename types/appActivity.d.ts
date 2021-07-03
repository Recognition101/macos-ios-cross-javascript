type AppActivities = { [id: string]: AppActivity };

interface AppActivity {
    name: string;
    id: string;
    /** The timestamp taken when the app was last updated in the App Store. */
    lastUpdated: string | null;
    artUrl: string | null;
}