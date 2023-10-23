type AppLists = {
    lists: { [name: string]: string[]; };
    metadata: { [id: string]: AppListsMetadata; };
}

type AppListsMetadata = {
    id: string;
    name: string;
    price: number;
    completed: boolean;
    /** The timestamp taken when the app was last updated in the App Store. */
    lastUpdated: string | null;
    artUrl: string | null;
    salePrice?: number;
    isDelisted?: boolean;
};

type AppListsMetadataAbandoned = {
    id: string;
    name: string;
};

type AppListsImport = { [id: string]: { name?: string } | null; };
