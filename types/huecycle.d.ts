declare namespace HueCycle {
    /** The base type for the HueCycle Config JSON file. */
    interface Config {
        /**
         * The username for the Philips Hue system.
         * @see https://developers.meethue.com/develop/get-started-2/
         */
        userName: string;

        /** The hostname to GET data from, ex: "10.0.1.14". */
        hostName: string;

        /** A list of all active `RandomProgram` programs. */
        randomPrograms: RandomProgram[];

        /** A list of all active `CycleProgram` programs. */
        cyclePrograms: CycleProgram[];
    }

    /** A program describing lights to randomly adjust the color of. */
    interface RandomProgram {
        /** List of lights this program involves. */
        lights: RandomLight[];

        /** If a light has no update rule, this will be used. */
        update: RandomColorUpdateRule;

        /** If explicitly true, do not run this program. */
        off?: boolean;
    }

    /**
     * The name of a light, and (optionally) a rule for how to update it.
     * If parts of the rule are missing, the `RandomProgram.update` is used.
     */
    interface RandomLight {
        /** The name of the light to randomize. */
        lightName: string;
        /** The rule for how to update the color of this light. */
        update?: Partial<RandomColorUpdateRule>;
    }

    /** A rule describing how to update the color of a light. */
    interface RandomColorUpdateRule {
        /** How often to change the color (randomly between min/max). */
        times: TimeRange;
        /** The new color will be randomly chosen from this list. */
        colors: Color[];
    }

    /** A program that cycles lights through a preset list of colors. */
    interface CycleProgram {
        /** The lights this program involves. */
        lights: string[];
        /** How often to cycle the colors (randomly between min/max). */
        times: TimeRange;
        /** The set of colors to cycle through (in order). */
        colors: Color[];
        /** If explicitly true, do not run this program. */
        off?: boolean;
    }

    /** A simple representation of an RGB color, each value from 0 - 255. */
    interface Color {
        /** A "Red" value, from 0 - 255. */
        r: number;
        /** A "Green" value, from 0 - 255. */
        g: number;
        /** A "Blue" value, from 0 - 255. */
        b: number;
    }

    /** A range of time (in seconds). */
    interface TimeRange {
        /** The minimum amount of time (in seconds). */
        min: number;
        /** The maximum amount of time (in seconds). */
        max: number;
    }

    /** An internal light state. Not used for configuration. */
    interface LightState {
        urlApi: string;
        name: string;
        id: string;
        color: Color;
    }
}
