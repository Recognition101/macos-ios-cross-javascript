// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-green; icon-glyph: pencil-alt;
// share-sheet-inputs: url;

///<reference path="./types/huecycle.d.ts" />
///<reference path="./types/philipshue.d.ts" />
// @ts-ignore
// eslint-disable-next-line
try { require; } catch(e) { require = importModule; }

const {
    getInput, error, readJson, downloadJson, wait, output, sendRequest
} = require('./lib/lib.js');

const pathFolder = '$/huecycle';
const pathConfig = `${pathFolder}/huecycle-config.js`;

/**
 * Updates a light to match a given state
 * @param {HueCycle.LightState} light the light to update
 */
const setLight = async (light) => {
    const r = light.color.r / 255;
    const g = light.color.g / 255;
    const b = light.color.b / 255;
    const min = Math.min(r, g, b);
    const max = Math.max(r, g, b);
    const delta = max - min;
    const hueNegative =
        delta === 0 ? 0 :
        max === r ? 1/6 * ((g - b) / delta % 6) :
        max === g ? 1/6 * ((b - r) / delta + 2) :
        max === b ? 1/6 * ((r - g) / delta + 4) : 0;

    const hue = hueNegative < 0 ? 1 + (hueNegative % 1) : hueNegative;
    const saturation = max === 0 ? 0 : delta / max;
    const value = max;

    const urlState = `${light.urlApi}/lights/${light.id}/state`;
    const newState = JSON.stringify({
        on: true,
        hue: Math.floor(hue * 65535),
        sat: Math.floor(saturation * 255),
        bri: Math.floor(value * 255)
    });

    await sendRequest(urlState, { }, newState, 'PUT');
};

/**
 * @typedef {CycleTask|RandomTask} Task
 */

class CycleTask {
    /**
     * @param {HueCycle.CycleProgram} program data describing the program
     * @param {HueCycle.LightState[]} lights the light to randomize
     * @param {number} index the current cycle we are on
     */
    constructor(program, lights, index) {
        this.program = program;
        this.lights = lights;
        this.index = index;
        this.time = 0;
    }

    setup() {
        const times = this.program.times;
        const waitTime = Math.random() * (times.max - times.min) + times.min;
        this.time = (new Date()).getTime() + waitTime * 1000;
    }

    async run() {
        const colors = this.program.colors;

        for(const [ i, light ] of this.lights.entries()) {
            light.color = colors[(this.index + i) % colors.length];
        }

        await Promise.all(this.lights.map(l => setLight(l)));
        this.index = (this.index + 1) % this.program.colors.length;
        this.setup();
    }

    /**
     * Creates the necessary tasks and appends them to a given set
     * @param {HueCycle.CycleProgram} program data describing the program
     * @param {HueCycle.LightState[]} lights all the lights
     * @param {Set<Task>} tasks the set of tasks to append to
     */
    static startTasks(program, lights, tasks) {
        if (program.off) {
            return;
        }
        /** @type {HueCycle.LightState[]} */
        const lightStates = [ ];
        for(const lightName of program.lights) {
            const lightState = lights.find(x => x.name === lightName);
            if (lightState) {
                lightStates.push(lightState);
            }
        }

        tasks.add(new CycleTask(program, lightStates, 0));
    }
}

class RandomTask {
    /**
     * @param {HueCycle.RandomProgram} program data describing the program
     * @param {HueCycle.LightState} light the light to randomize
     */
    constructor(program, light) {
        this.program = program;
        this.light = light;
        this.time = 0;
        this.color = light.color;
        this.setup();
        this.time = 0;
    }

    setup() {
        const lightName = this.light.name;
        const light = this.program.lights.find(x => x.lightName === lightName);
        const colors = light?.update?.colors ?? this.program.update.colors;
        const times = light?.update?.times ?? this.program.update.times;
        const waitTime = Math.random() * (times.max - times.min) + times.min;

        this.time = (new Date()).getTime() + waitTime * 1000;
        this.color = colors[Math.floor(colors.length * Math.random())];
    }

    async run() {
        this.light.color = this.color;
        await setLight(this.light);
        this.setup();
    }

    /**
     * Creates the necessary tasks and appends them to a given set
     * @param {HueCycle.RandomProgram} program data describing the program
     * @param {HueCycle.LightState[]} lights all the lights
     * @param {Set<Task>} tasks the set of tasks to append to
     */
    static startTasks(program, lights, tasks) {
        if (program.off) {
            return;
        }
        for(const randomLight of program.lights) {
            const light = lights.find(x => x.name === randomLight.lightName);
            if (light) {
                tasks.add(new RandomTask(program, light));
            }
        }
    }
}

const help = `Cycles Philips Hue light shades randomly based on a config file.

Setup: Manually create the Hue Cycle Config JSON file.

Hue Cycle Config JSON Path: ${pathConfig}
Hue Cycle Config JSON Type: $/types/huecycle.d.ts::HueCycle.Config`;

const main = async () => {
    const name = 'Hue Cycle';
    const input = await getInput({ name, help, inScriptable: false });
    if (!input) { return; }

    const configJson = await readJson(pathConfig);
    const config = /** @type {HueCycle.Config|null} */(configJson);
    const hostName = config?.hostName;
    const userName = config?.userName;

    if (!config || !hostName || !userName) {
        return error(
            'Hue Cycle',
            !config ? 'No config JSON found.' :
            !hostName ? 'No host name in config JSON.' :
            !userName ? 'No user name in config JSON.' : 'Config corrupt.'
        );
    }

    // Set Up Lights
    const urlApi = `http://${hostName}/api/${userName}`;
    const infoJson = await downloadJson(urlApi);
    const info = /** @type {PhilipsHue.Index|null} */(infoJson);
    if (!info) {
        return error('Hue Cycle', 'Could not get light information.');
    }
    const lights = Object.entries(info.lights).map(([id, info]) => ({
        id,
        urlApi,
        name: info.name,
        color: { r: 0, g: 0, b: 0 }
    }));

    // Set Up Tasks
    /** @type {Set<Task>} */
    const tasks = new Set();
    for(const program of config.randomPrograms) {
        RandomTask.startTasks(program, lights, tasks);
    }
    for(const program of config.cyclePrograms) {
        CycleTask.startTasks(program, lights, tasks);
    }

    // Task Running Loop
    while(tasks.size > 0) {
        const timeStart = (new Date()).getTime();
        let minTime = -1;
        for(const task of tasks) {
            minTime = minTime >= 0 ? Math.min(task.time, minTime) : task.time;
        }
        const waitTime = minTime - timeStart;

        if (waitTime > 0) {
            await wait(waitTime + 1);
        }

        const timeRun = (new Date()).getTime();
        for(const task of tasks) {
            if (task.time <= timeRun) {
                await task.run();
            }
            if (task.time <= timeRun) {
                tasks.delete(task);
            }
        }
    }

    output('Hue Cycle', 'Done.');
};

main();
