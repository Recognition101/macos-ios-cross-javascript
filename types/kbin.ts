export type KbinHistory = {
    upvotes: KbinUpvote[];
};

export type KbinUpvote = {
    originalUrl: string;
    url: string;
    title: string;
    user: string;
    time: string;
    community: string;
    votes: string;
};
