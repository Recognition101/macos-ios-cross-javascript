// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: light-brown; icon-glyph: gamepad;
// share-sheet-inputs: file-url;
/// <reference path="./types/retroarch.d.ts" />
// @ts-ignore
// eslint-disable-next-line
try { require; } catch(e) { require = importModule; }

const {
    getInput, string, output, readJson, readText, writeText, error
} = require('./lib/lib.js');

const pathConfig = '$/retroarch/retroconfig.json';

const help = `Updates a retroarch.cfg with preferred custom config.

Setup: Manually create the RetroConfig JSON file.

RetroConfig JSON Path: ${pathConfig}
RetroConfig JSON Type: $/types/retroarch.d.ts::RetroArch.ConfigChanges`;

const main = async () => {
    const input = await getInput({
        name: 'Retrarch Set Config',
        help,
        inScriptable: false,
        args: [{
            name: 'file',
            shortName: 'f',
            type: 'pathFile',
            bookmarkName: 'retroarch-set-config-file',
            help: 'The config file to patch.'
        }]
    });
    if (!input) { return; }

    const configPatchMap = /** @type {Object<string, string>|null} */(
        await readJson(pathConfig)
    );
    if (!configPatchMap) {
        return error(
            "Retroarch Set Config",
            "Could not load RetroConfig JSON."
        );
    }

    const configPath = string(input.file);
    let config = (await readText(configPath)) || '';
    const configPatches = Object.entries(configPatchMap);
    let patchCount = 0;

    for(const [key, value] of configPatches) {
        if (!key.startsWith("// ")) {
            const replacer = new RegExp(`^${key}\\s*=.*$`, 'mg');
            config = config.replace(replacer, `${key} = "${value}"`);
            patchCount += 1;
        }
    }

    await writeText(configPath, config);

    output('Retroarch Set Config', `Updated ${patchCount} keys.`);
};

main();
