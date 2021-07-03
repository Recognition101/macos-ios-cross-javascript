// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-green; icon-glyph: folder-open;
// share-sheet-inputs: url;

///<reference path="./types/featuredGame.d.ts" />
///<reference path="./types/tunesQuery.d.ts" />
// @ts-ignore
// eslint-disable-next-line
try { require; } catch(e) { require = () => importModule('lib/scriptable'); }

const {
    getFileSize, pathJoin, listFiles, moveFile, writeText, isDirectory,
    getInput, string, output,
} = require('./lib/node.js');

const mainWadInfo = [
    { name: 'doom-1.wad', size: 10898 },
    { name: 'doom-2.wad', size: 14262 },
    { name: 'doom-ultimate.wad', size: 12117 }
];

const mainWadNames = new Set([ 'doom.wad', ...mainWadInfo.map(x => x.name) ]);
const mainWadName = 'DOOM.WAD';
const configName = 'prboom.cfg';

/**
 * @param {string} pathRoot the root directory whose children we will configure
 * @return {Promise<number>} the number of child directories we configured
 */
const configureDirectory = async (pathRoot) => {
    let result = 0;
    const files = await listFiles(pathRoot);

    const wads = files.filter(name => name.toLowerCase().endsWith('.wad'));
    const wadsMod = wads.filter(name => !mainWadNames.has(name.toLowerCase()));
    const wadsMain = wads.filter(name => mainWadNames.has(name.toLowerCase()));
    const dehs = files.filter(name => name.toLowerCase().endsWith('.deh'));

    wadsMod.sort();
    dehs.sort();

    if (wadsMain.length > 0 && (wadsMod.length > 0 || dehs.length > 0)) {
        const pathMain = pathJoin(pathRoot, mainWadName);
        const pathConfig = pathJoin(pathRoot, configName);

        for(const wadMain of wadsMain) {
            await moveFile(pathJoin(pathRoot, wadMain), pathMain);
        }

        const size = await getFileSize(pathMain);
        const wadInfo = mainWadInfo.find(x => Math.abs(x.size - size) < 100);
        const wadName = wadInfo ? wadInfo.name : 'Unknown';

        const wadLines = wadsMod.map((wad, i) => `wadfile_${i+1}    "${wad}"`);
        const dehLines = dehs.map((deh, i) => `dehfile_${i+1}    "${deh}"`);

        const title = `# Base DOOM file is: ${wadName}\n`;
        const config = title + wadLines.concat(dehLines).join('\n') + '\n';
        await writeText(pathConfig, config);

        result += 1;
    }

    for(const fileName of files) {
        const filePath = pathJoin(pathRoot, fileName);
        if (await isDirectory(filePath)) {
            result += await configureDirectory(filePath);
        }
    }

    return result;
};

const help = `Crawl a folder (and children). In every folder with a *.wad file:

 1. Create a config file: ${configName}
    This file lists all WAD/DEH files so the PrBoom emulator can run them.

 2. Rename any files:
        From: ${mainWadInfo.map(x => x.name).join(', ')}
        To:   ${mainWadName}
    So the "Retroarch Make Playlist" script can assume Doom Mods all run:
        ./{{mod-name}}/${mainWadName}`;

const main = async () => {
    const input = await getInput({
        help,
        inScriptable: true,
        args: [{
            name: 'folder',
            shortName: 'f',
            help: 'The folder to spider looking for WAD children.',
            type: 'pathFolder',
            bookmarkName: 'retroarch-doom-config-folder'
        }]
    });

    if (!input) { return; }


    const configureCount = await configureDirectory(string(input.folder));

    output('Retroarch Doom Config', `Configured: ${configureCount}`);
};

main();
