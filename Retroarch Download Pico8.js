// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: light-brown; icon-glyph: memory;
// share-sheet-inputs: plain-text, url;
/// <reference path="./types/retroarch.d.ts" />
// @ts-ignore
// eslint-disable-next-line
try { require; } catch(e) { require = importModule; }

const {
    getInput,
    string,
    encodeURIComponent,
    downloadText,
    downloadFile,
    pathJoin,
    isFile,
    log,
    output
} = require('./lib/lib.js');

/**
 * @typedef {Object} Thread represents a Pico-8 BBS Thread
 * @param {string} url the link to the thread
 * @param {string} name the name of the thread
 */

const urlLister = 'https://www.lexaloffle.com/bbs/lister.php';
const urlCarts = 'https://www.lexaloffle.com/bbs/cposts';

/** @type {ObjectMap<string>} */
const urlListerQuery = {
    use_hurl: '1',
    cat: '7',
    sub: '2',
    mode: '',
    page: '1',
    orderby: 'featured'
};

const help = '' +
`Downloads all "Featured" Pico-8 games into a given directory. If a game already
exists, it will not be re-downloaded.
`;

/**
 * Given a query string key-value map, generates a query string.
 * @param {ObjectMap<string>} map the map of parameter keys to values
 * @return {string} the resulting query string
 */
const getQueryString = map =>
    Object.entries(map)
        .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
        .join('&');

/**
 * Converts a user-edited name into a proper file name.
 * @param {string} name the name to convert
 * @return {string} the file name
 */
const getFileName = name => name
    .replaceAll('[', '(')
    .replaceAll(']', ')')
    .replaceAll(/\s*&\s*/g, ' + ')
    .replaceAll(/\s*:+\s*/g, ' - ')
    .replaceAll(/\s*\/+\s*/g, '--')
    .replaceAll(/[^\w\s\-'",.#()]/g, '_');

const gameMatcher = /`([^`]+)`[,'" \n]+\/bbs\/thumbs\/(.+?)\.png/g;

/**
 * Parse CLI arguments and run `downloadPlaylist` once for every playlist found
 * in the configuration file.
 */
const main = async () => {
    const input = await getInput({
        name: 'Retroarch Download Pico8',
        help,
        inScriptable: true,
        args: [{
            name: 'folder',
            shortName: 'f',
            type: 'pathFolder',
            bookmarkName: 'retroarch-download-pico8-destination',
            help: 'The directory to populate with Pico-8 cartridges.'
        }]
    });
    if (!input) { return; }

    const folder = string(input.folder);

    let page = 1;
    let countFound = 1;
    let countDownload = 0;
    let countFail = 0;
    let countCache = 0;

    while(countFound > 0) {
        countFound = 0;
        urlListerQuery.page = page.toString();
        const query = getQueryString(urlListerQuery);
        const text = await downloadText(`${urlLister}?${query}`);

        for(const game of text.matchAll(gameMatcher) ?? [ ]) {
            const urlName = game[2].replace(/^pico(8_)?/, '');
            const urlPrefix = /\d+/.test(urlName)
                ? urlName.substring(0, 1)
                : urlName.substring(0, 2);
            const url = `${urlCarts}/${urlPrefix}/${urlName}.p8.png`;

            const name = game[1]
                .replaceAll('&amp;', '&')
                .replaceAll('&quot;', '"');

            const nameFile = getFileName(name) + '.p8.png';
            const pathFile = pathJoin(folder, nameFile);

            if (await isFile(pathFile)) {
                log(`[  C] - ${nameFile}`);
                countCache += 1;
            } else {
                const code = await downloadFile(url, pathFile);
                log(`${code === 200 ? '[ D ]' : '[X  ]'} - ${nameFile}`);
                countFail += code === 200 ? 0 : 1;
                countDownload += code === 200 ? 1 : 0;
            }

            countFound += 1;
        }

        page += 1;
    }

    output(
        'Retroarch Download Pico8',
        `Downloaded: ${countDownload}, ` +
        `Failed: ${countFail}, ` +
        `Cached: ${countCache}`
    );
};

main();
