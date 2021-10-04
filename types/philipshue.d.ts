declare namespace PhilipsHue {
    interface Index {
        lights: {
            [index: string]: {
                state: {
                    on: boolean;
                    /** A brightness, from 0 - 255 */
                    bri: number;
                    /** A hue, from 0 - 65535 */
                    hue: number;
                    /** A saturation, from 0 - 255 */
                    sat: number;
                    effect: string;
                    /** Color as X-Y coordinates (each in 0-1). */
                    xy: [ number, number ];
                    /** White Color temperature, 154 (cold) - 500 (warm). */
                    ct: number;
                    /**
                     * How to notify the user it has been selected.
                     * * 'select': The light will flash once.
                     * * 'lselect': The light flashes for 10 seconds.
                     */
                    alert: 'select' | 'lselect';
                    /** The color mode. Ex: 'ct'. */
                    colormode: string;
                    mode: string; // Ex: 'ct'
                    reachable: boolean;
                };
                swupdate: {
                    /** The update state. Example: 'noupdates'. */
                    state: string;
                    /**
                     * The timestamp of the last software install.
                     * Ex: '2021-08-19T21:54:08'
                     */
                    lastinstall: string;
                };
                /** The type of light. Ex: 'Extended color light'. */
                type: string;
                /** The user-set name of the light. Ex: 'Dining Room 1'. */
                name: string;
                /** The Model ID. Ex: 'LCT007'. */
                modelid: string;
                /** The manufacturer name. Ex: 'Signify Netherlands B.V.'. */
                manufacturername: string;
                /** The product name. Ex: 'Hue color lamp'. */
                productname: string;
                capabilities: {
                    certified: boolean;
                    control: {
                        mindimlevel: number;
                        maxlumen: number;
                        colorgamuttype: string;
                        /** Supported color gamut. Each number is in [0, 1]. */
                        colorgamut: [
                            [ number, number ],
                            [ number, number ],
                            [ number, number ]
                        ];
                        /** The minimum and maximum color temperature values. */
                        ct: { min: number; max: number; }
                    };
                    streaming: {
                        renderer: boolean;
                        proxy: boolean;
                    };
                };
                config: {
                    /** The type of bulb hardware. Ex: 'sultanbulb'. */
                    archetype: string;
                    /** The function of this light. Ex: 'mixed'. */
                    function: string;
                    /** The light direction. Ex: 'omnidirectional'. */
                    direction: string;
                    startup: {
                        /** The startup mode (ex: 'powerfail' to turn on). */
                        mode: string;
                        configured: boolean;
                    };
                };
                /** A GUID for this light. Ex: '00:17:88:01:10:55:f1:25-0b'. */
                uniqueid: string;
                /** The software version number running. Ex: '67.88.1'. */
                swversion: string;
            }
        }
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
