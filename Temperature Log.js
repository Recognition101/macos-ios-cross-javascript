// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-green; icon-glyph: pencil-alt;
// share-sheet-inputs: url;

///<reference path="./types/temperature.d.ts" />
///<reference path="./types/philipshue.d.ts" />
// @ts-ignore
// eslint-disable-next-line
try { require; } catch(e) { require = importModule; }

const {
    getInput, output, error, readJson, writeJson, downloadJson, makeDirectory
} = require('./lib/lib.js');

const now = new Date();
const nowString = [
    now.getFullYear().toString(),
    (now.getMonth() + 1).toString().padStart(2, '0'),
    now.getDate().toString().padStart(2, '0')
].join('-');

const pathFolder = '$/temperature';
const pathConfig = `${pathFolder}/temperature-config.json`;
const pathLog = `${pathFolder}/temperature-log-${nowString}.json`;

const help = `Logs into a Philips Hue system with login details from the
Temperature Config JSON file, and copies all current thermometer readings into
the Temperature Log JSON file. Note that all temperatures are recorded in
degrees Celsius times 100 (ex: a recording of 2468 means 24.68 degrees C).

Setup: Manually create the Temperature Config JSON file.

Temperature Config JSON Path: ${pathConfig}
Temperature Config JSON Type: $/types/temperature.d.ts::Temperature.Config
Temperature Log JSON Path: ${pathLog}
Temperature Log JSON Type: $/types/temperature.d.ts::Temperature.Log`;

const main = async () => {
    const name = 'Temperature Log';
    const input = await getInput({ name, help, inScriptable: false });
    if (!input) { return; }

    const configJson = await readJson(pathConfig);
    const config = /** @type {Temperature.Config|null} */(configJson);
    const hostName = config?.hostName;
    const userName = config?.userName;
    if (!config || !hostName || !userName) {
        return error(
            'Temperature Log',
            !config ? 'No config JSON found.' :
            !hostName ? 'No host name in config JSON.' :
            !userName ? 'No user name in config JSON.' : 'Config corrupt.'
        );
    }

    const logJson = await readJson(pathLog);
    const logMaybe = /** @type {Temperature.Log|null} */(logJson);
    const log = logMaybe || { latest: { }, data: { }, lastUpdated: 0 };
    log.lastUpdated = now.getTime();

    const infoJson = await downloadJson(`http://${hostName}/api/${userName}`);
    const info = /** @type {PhilipsHue.Index|null} */(infoJson);

    for(const sensor of Object.values(info?.sensors ?? { })) {
        const name = config.deviceAliasMap?.[sensor.name] ?? sensor.name;
        const temperature = sensor.state?.temperature;
        const lastUpdated = sensor.state?.lastupdated;
        if (name && temperature && lastUpdated) {
            const lastUpdatedDate = new Date(lastUpdated);
            const tzOffset = lastUpdatedDate.getTimezoneOffset() * 60 * 1000;
            const lastUpdatedTime = lastUpdatedDate.getTime() - tzOffset;

            log.latest[name] = temperature;
            log.data[name] = log.data[name] || { };
            log.data[name][lastUpdatedTime] = temperature;
        }
    }

    await makeDirectory(pathFolder);
    await writeJson(pathLog, log);

    const timeWritten = (new Date()).toISOString();
    output('Temperature Log', `Temperatures Recorded at: ${timeWritten}`);
};

main();
