// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: light-brown; icon-glyph: images;
// share-sheet-inputs: file-url;
/// <reference path="./types/retroarch.d.ts" />
// @ts-ignore
// eslint-disable-next-line
try { require; } catch(e) { require = importModule; }

const {
    getInput, string, output, error, log,
    pathJoin, listFiles, isFile, makeDirectory, readJson,
    downloadFile, encodeURIComponent
} = require('./lib/lib.js');

/** @type {[ 'Named_Boxarts', 'Named_Snaps', 'Named_Titles' ]}*/
const imageTypes = [ 'Named_Boxarts', 'Named_Snaps', 'Named_Titles' ];
const outputName = 'config';
const imagesName = 'images';

/** @type {ObjectMap<string>} */
const suffixMap = {
    'Legend of Zelda, The - Link\'s Awakening DX':
        ' (USA, Europe) (SGB Enhanced) (GB Compatible)',
    'Legend of Zelda, The - Oracle of Ages': ' (USA, Australia)',
    'Legend of Zelda, The - Oracle of Seasons': ' (USA, Australia)',
    'Metroid II - Return of Samus': ' (World)',
    'Fire Emblem': ' (USA, Australia)',
    'Mario & Luigi - Superstar Saga': ' (USA, Australia)',
    'Metroid Fusion': ' (USA, Australia)',
    'Super Mario Advance': ' (USA, Europe)',
    'Legend of Zelda, The - A Link to the Past & Four Swords':
        ' (USA, Australia)',
    'Worms Armageddon': ' (USA) (En,Fr,Es)',
    'Legend of Zelda, The - Ocarina of Time - Master Quest':
        ' (USA) (GameCube)',
    'Donkey Kong Country 2 - Diddy\'s Kong Quest': ' (USA) (En,Fr)',
    'Donkey Kong Country 3 - Dixie Kong\'s Double Trouble!': ' (USA) (En,Fr)',
    'Worms - Open Warfare 2': ' (USA) (En,Fr)',
    'Legend of Zelda, The - Skyward Sword': ' (USA) (En,Fr,Es) (v1.00)'
};

const imageUrlRoot = 'https://raw.githubusercontent.com/libretro-thumbnails';

/**
 * Gets the image URL based on components. ex:
 * https://raw.githubusercontent.com/libretro-thumbnails/ ..
 * .. Nintendo_-_Nintendo_64 ..
 * .. /master/Named_Boxarts/Banjo-Kazooie%20(USA).png
 *
 * @param {string} systemUrl the system URL (ex: 'Nintendo_-_Game_Boy')
 * @param {string} typeUrl the type of image to fetch (ex: 'Named_Snaps')
 * @param {string} nameUrl the game name URI (ex: 'Banjo-Kazooie%20(USA)')
 * @return {string} the URL to fetch
 */
const makeImageUrl = (systemUrl, typeUrl, nameUrl) =>
    `${imageUrlRoot}/${systemUrl}/master/${typeUrl}/${nameUrl}.png`;

/**
 * Downloads an image (or images) representing a given game, or outputs that
 * it could not find the images.
 * @param {string} imageRootPath the directory we are downloading to
 * @param {string[]} systemUrls systems to look in (ex: 'Nintendo_-_Game_Boy')
 * @param {string} name the name of the game ROM file (without extension)
 */
const downloadImages = async (imageRootPath, systemUrls, name) => {
    const hasSuffix = name.endsWith(')');
    const suffix = hasSuffix ? '' : (suffixMap[name] || ' (USA)');
    const nameUrl = encodeURIComponent((name + suffix).replace(/&/g, '_'));
    const fileName = name.replace(/&/g, '_') + '.png';

    for(const type of imageTypes) {
        const typePadded = type.padStart(15, ' ');
        const urls = systemUrls.map(url => makeImageUrl(url, type, nameUrl));

        const filePath = pathJoin(pathJoin(imageRootPath, type), fileName);
        const exists = await isFile(filePath);
        let successUrl = '';

        for(const url of urls) {
            if (!exists && !successUrl) {
                const code = await downloadFile(url, filePath);
                successUrl = code === 200 ? url : successUrl;
            }
        }

        if (exists) {
            log(`[  C]     Cached: ${typePadded} / ${name}`);
        } else if (successUrl) {
            log(`[ D ] Downloaded: ${typePadded} / ${name}`);
        } else {
            log(`[X  ]      ERROR: ${typePadded} / ${name}. Tried:`);
            for(const url of urls) {
                log(`       - ${url}`);
            }
        }
    }
};

/**
 * Downloads all the images for a given `Retroarch.ImageEmulatorConfig`.
 * @param {string} inputPath the path to folder to scan for files
 * @param {string} outputPath the path to the folder to write image files to
 * @param {RetroArch.ImageFolderConfig} config the data describing the folder
 * @return {Promise<number>} the number of files we processed
 */
const downloadFolder = async (inputPath, outputPath, config) => {
    await makeDirectory(outputPath);
    for(const type of imageTypes) {
        await makeDirectory(pathJoin(outputPath, type));
    }

    let downloadedCount = 0;
    const extensions = config.extensions.map(x => x.toLowerCase());

    for(const fileName of await listFiles(inputPath)) {
        const dotIndex = fileName.lastIndexOf('.');
        const name = fileName.substring(0, dotIndex);
        const extension = fileName.substring(dotIndex + 1).toLowerCase();

        if (extensions.includes(extension)) {
            await downloadImages(outputPath, config.urls, name);
            downloadedCount += imageTypes.length;
        }
    }

    return downloadedCount;
};

const help = '' +
`Spiders files in a given working directory (WD). For each file at:
    WD/<KEY>/*.<EXTENSION>

An image is downloaded to:
    WD/${outputName}/${imagesName}/<OUTPUT>/<TYPE>/*.png

Where <KEY>, <EXTENSION>, and <OUTPUT> are from a RetroArch Images JSON.

Setup: Manually create a RetroArch Images JSON.

RetroArch Images JSON Path: (Provided with -c or --config flag)
RetroArch Images JSON Type: $/types/retroarch.d.ts::RetroArch.ImageConfig`;

/**
 * Parse CLI arguments and run `downloadPlaylist` once for every playlist found
 * in the configuration file.
 */
const main = async () => {
    const input = await getInput({
        name: 'Retroarch Download Images',
        help,
        inScriptable: true,
        args: [{
            name: 'folder',
            shortName: 'f',
            type: 'pathFolder',
            bookmarkName: 'retroarch-make-playlist-thumbnails-folder',
            help: 'The working directory (WD) to spider/output to.'
        }, {
            name: 'config',
            shortName: 'c',
            type: 'pathFile',
            bookmarkName: 'retroarch-make-playlist-thumbnails-config',
            help: 'The config file describing ROM extensions and directories.'
        }]
    });
    if (!input) { return; }

    const configJson = await readJson(string(input.config));
    const config = /** @type {RetroArch.ImageConfig|null} */(configJson);
    const folder = string(input.folder);

    if (!config) {
        return error('Retroarch Make Playlist', 'Could not read config.');
    }

    const imagesPath = pathJoin(pathJoin(folder, outputName), imagesName);
    await makeDirectory(pathJoin(folder, outputName));
    await makeDirectory(imagesPath);

    let imageCount = 0;

    for(const [inputFolder, outputConfig] of Object.entries(config.folderMap)) {
        const inputPath = pathJoin(folder, inputFolder);
        const outputPath = pathJoin(imagesPath, outputConfig.out);
        imageCount += await downloadFolder(inputPath, outputPath, outputConfig);
    }

    output('Retroarch Download Images', `Downloaded ${imageCount} images.`);
};

main();
