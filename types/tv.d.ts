declare namespace Tv {
    interface ShowConfig {
        /** The list of TV Shows the user can choose from. */
        shows: Show[];
    }

    interface Show {
        /** The name of the TV Show, ex: "The Simpsons". */
        name: string;
        /** The code CLI users use to specify the show, ex: "simpsons". */
        code: string;

        /**
         * The number of episodes per season to choose from.
         * Ex: [ 13, 22, 24, 22, 22, 25, 25, 25, 25, 23, 22 ]
         */
        seasons: number[];
    }
}
