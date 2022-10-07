// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-green; icon-glyph: mobile-alt;

///<reference path="./types/featuredGame.d.ts" />
///<reference path="./types/tunesQuery.d.ts" />
// @ts-ignore
// eslint-disable-next-line
try { require; } catch(e) { require = importModule; }

const {
    getInput, string, error, status, output,
    pathJoin, readText, isFile,
    downloadFile, downloadJson
} = require('./lib/lib.js');

const help = `Searches a plain-text file for all iTunes IDs of the form
"/id{number}" and downloads an icon for each ID found.
`;

const main = async () => {
    const iTunesUrl = 'https://itunes.apple.com/lookup?id=';

    const input = await getInput({
        name: 'App Icons',
        help,
        inScriptable: true,
        args: [{
            name: 'folder',
            shortName: 'a',
            help: 'The folder to download App Icons into.',
            type: 'pathFolder',
            bookmarkName: 'app-icons-add-folder'
        }, {
            name: 'file',
            shortName: 'f',
            help: 'The file to search for App IDs in.',
            type: 'pathFile',
            bookmarkName: 'app-icons-search-file'
        }]
    });

    if (!input) { return; }

    const pathFolder = string(input.folder);
    const pathFile = string(input.file);

    if (!pathFolder || !pathFile) {
        return error('App Icons', 'Missing File or Folder path.');
    }

    const textFile = await readText(pathFile);
    if (textFile === null) {
        return error('App Icons', 'Cannot read text file.');
    }

    const matches = Array.from(textFile.matchAll(/\/id(\d+)/g));

    /** @type {string[]} */
    const failureList = [];
    let downloadCount = 0;
    let cacheCount = 0;

    for(const [i, match] of matches.entries()) {
        status(`Fetching ${i} / ${matches.length}`);
        const id = match[1];
        const pathImage = pathJoin(pathFolder, `id${id}.jpg`);
        const isImageExisting = await isFile(pathImage);

        if (!isImageExisting) {
            const searchJson = await downloadJson(iTunesUrl + id);
            const search = /** @type {TunesQuery|null} */(searchJson);
            const app = search && search.results && search.results[0];
            const artUrl = app && app.artworkUrl512;
            if (artUrl) {
                await downloadFile(artUrl, pathImage);
                downloadCount += 1;
            } else {
                failureList.push(id);
            }
        } else {
            cacheCount += 1;
        }
    }

    const failureString = failureList.length === 0
        ? 'No failures.'
        : `Failed to download: ${failureList.join(' ')}`;

    const doneString = `Finished: ` +
        `Downloaded ${downloadCount}, Cached: ${cacheCount}, ${failureString}`;

    status(doneString);
    output('App Icons', doneString);
};

main();
