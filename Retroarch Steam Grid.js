// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: light-brown; icon-glyph: th;
// @ts-ignore
// eslint-disable-next-line
try { require; } catch(e) { require = importModule; }

const {
    getInput, string, readJson, output, error, pathJoin, listFiles,
    isFile, log, copyFile, makeDirectory, makeCrc32Table, getCrc32
} = require('./lib/lib.js');

const nameOutput = 'config';
const nameImages = 'images';
const nameImagesType = 'Named_Boxarts';
const nameGrid = 'grid';

/**
 * Given a string, replace all keys of a map with their values.
 * @param {ObjectMap<string>} map replace all of these keys with these values
 * @param {string} str make the replacements within this string
 * @return {string} the string with substitutions made
 */
const substitute = (map, str) => 
    Object.entries(map).reduce(
        (val, [k, v]) => val.replace(new RegExp(k, 'g'), v),
        str
    );

const help = '' +
`Copies images:
    FROM: WD/${nameOutput}/${nameImages}/<OUTPUT>/${nameImagesType}/*.png
    TO:   WD/${nameOutput}/${nameGrid}/<hash>.png

It reads those images and copies them into ${nameGrid} with specific
hash-based names that allows Steam to display them.

To use these images in Steam, copy:
    FROM: WD/${nameOutput}/${nameGrid}
    TO:   %STEAM_INSTALL$\\Steam\\userdata\\%USER_ID%\\config

Setup: Use "Retroarch Download Images.js" to download "FROM" images.
Setup: Use RetroArch Images JSON from "Retroarch Download Images.js".
Setup: Use RetroArch Steam JSON from "Retroarch Steam Config.js".`;

const main = async () => {
    const input = await getInput({
        name: 'Retroarch Steam Grid',
        help,
        inScriptable: true,
        args: [{
            name: 'folder',
            shortName: 'f',
            type: 'pathFolder',
            bookmarkName: 'retroarch-steam-grid-folder',
            help: 'The working directory (WD) to scan for images.'
        }, {
            name: 'images',
            shortName: 'i',
            type: 'pathFile',
            bookmarkName: 'retroarch-steam-grid-images',
            help: 'The config file used by Retroarch Download Images.'
        }, {
            name: 'config',
            shortName: 'c',
            type: 'pathFile',
            bookmarkName: 'retroarch-steam-grid-config',
            help: 'The config file used by Retroarch Steam Config.'
        }]
    });
    if (!input) { return; }

    const folder = string(input.folder);

    const json = await readJson(string(input.config));
    const config = /** @type {RetroArch.SteamConfig|null} */(json);

    const imagesJson = await readJson(string(input.images));
    const images = /** @type {RetroArch.ImageConfig|null} */(imagesJson);

    if (!config) {
        return error('Retroarch Steam Grid', 'Could not read config.');
    }

    if (!images) {
        return error('Retroarch Steam Grid', 'Could not read images config.');
    }

    const pathImages = pathJoin(folder, nameOutput, nameImages);
    const pathTo = pathJoin(folder, nameOutput, nameGrid);
    await makeDirectory(pathTo);

    const crc32Table = makeCrc32Table();
    const subMap = config.substitutions;

    let copied = 0;
    let missing = 0;

    for(const emulator of config.emulators) {
        const nameRoms = emulator.directory;
        const pathRoms = pathJoin(folder, nameRoms);

        const imageMapConfig = images.folderMap[emulator.directory];
        const nameFrom = imageMapConfig ? imageMapConfig.out : nameRoms;
        const pathFrom = pathJoin(pathImages, nameFrom, nameImagesType);

        const suffixes = emulator.extensions.map(x => '.' + x.toLowerCase());

        for(const fileName of await listFiles(pathRoms)) {
            const fileLower = fileName.toLowerCase();
            const suffix = suffixes.find(x => fileLower.endsWith(x));

            if (typeof suffix === 'string') {
                const nameLength = fileName.length - suffix.length;
                const name = fileName.substring(0, nameLength);
                const nameApp = name.replace(/\(.*?\)|\[.*?\]/g, '').trim();

                const pathFromImage = pathJoin(pathFrom, name + '.png');
                if (!await isFile(pathFromImage)) {
                    log(`WARNING: Could not find image for: ${name}.png`);
                    missing += 1;

                } else {
                    const exe = substitute(subMap, emulator.exe);
                    const checksum = getCrc32(crc32Table, exe + nameApp) >>> 0;
                    const id32 = BigInt(checksum) | BigInt(0x80000000);
                    const id = (id32 << BigInt(32)) | BigInt(0x02000000);

                    const nameToImage = id.toString() + '.png';
                    const pathToImage = pathJoin(pathTo, nameToImage);
                    await copyFile(pathFromImage, pathToImage);
                    copied += 1;
                }
            }
        }
    }

    output('Retroarch Steam Grid', `Copied: ${copied}, missing: ${missing}`);
};

main();
