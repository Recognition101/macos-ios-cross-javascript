declare namespace ItchIo {
    interface GameMetadata {
        /** A URL for the cover image art. */
        cover_image: string;
        tags: string[];
        authors: { name: string; url: string; }[];
        id: number;
        links: {
            comments: string;
            self: string;
        };
        title: string;
        price: string;
    }
}
