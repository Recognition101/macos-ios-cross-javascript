declare namespace Temperature {

    /** This is the type for the required Temperature Config JSON file.  */
    interface Config {
        /**
         * The username for the Philips Hue system.
         * @see https://developers.meethue.com/develop/get-started-2/
         */
        userName: string;

        /** The hostname to GET data from, ex: "10.0.1.14". */
        hostName: string;
    }

    interface Log {
        lastUpdated: number;
        latest: {
            [sensorName: string]: number;
        };
        data: {
            [sensorName: string]: {
                [timestamp: string]: number;
            }
        };
    }

    interface HueResponse {
        sensors: {
            [index: string]: {
                name: string;
                state: {
                    temperature?: number;
                    lastupdated?: string;
                }
            }
        }
    }
}
