declare namespace Wishlist {
    /** Maps App IDs as keys to info about the app/pricing as values. */
    type AppMap = { [appId: string]: Wishlist.App };

    interface App {
        price: number;
        name: string;
        artUrl: string;
        salePrice?: number;
    }
}

