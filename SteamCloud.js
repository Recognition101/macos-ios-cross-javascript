// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: yellow; icon-glyph: cloud-download-alt;
// @ts-ignore
// eslint-disable-next-line
try { require; } catch(e) { require = importModule; }
const {
    external,
    getInput,
    string,
    output,
    error,
    status,
    pathJoin,
    makeDirectory,
    writeJson,
    sendRequest,
    downloadFile
} = require('./lib/lib.js');

/**
 * @typedef {import("./lib/external/external.cjs").parse5.Document} Document
 * @typedef {import("./lib/external/external.cjs").parse5.ChildNode} ChildNode
 * @typedef {import("./lib/external/external.cjs").parse5.Element} Element
 *
 * @typedef {Object} SteamCloudRoot
 * @prop {SteamCloudGame[]} games
 *
 * @typedef {Object} SteamCloudGame
 * @prop {string} name
 * @prop {string} folderName
 * @prop {string} fileCount
 * @prop {string} fileSize
 * @prop {string|null} url
 *
 * @typedef {Object} SteamCloudGameData
 * @prop {SteamCloudFile[]} files
 *
 * @typedef {Object} SteamCloudFile
 * @prop {string} localName
 * @prop {string} folder
 * @prop {string} name 
 * @prop {string} size 
 * @prop {string} date
 * @prop {string} url
 */

const urlRoot = 'https://store.steampowered.com/account/remotestorage';
const fileNameRoot = 'manifest.json';
const fileNameGame = 'game-manifest.json';

const help = `Downloads all Steam Cloud Data.

    ${urlRoot}

Setup: Go to the above site, log in, and copy the resulting request cookie.`;

/**
 * Given a Parse5 node, select an element whose attributes match test functions.
 * @typedef {(value: string|undefined) => boolean} Predicate
 * @param {Document|ChildNode|null} el the node to get the content from
 * @param {ObjectMap<Predicate|string>} constraints select all nodes that
 *      return `true` for each of these attributes.
 * @param {Element[]} [matched] the elements that matched the constraints
 * @return {Element[]} the elements that matched the constraints
 */
const select = (el, constraints, matched = [ ]) => {
    if (el && 'attrs' in el) {
        const isMatch = Object.entries(constraints).every(([name, test]) => {
            const attribute = el.attrs.find(x => x.name === name);
            const value = name === 'tagName' ? el.tagName : attribute?.value;
            return typeof test === 'string' ? test === value : test(value);
        });
        if (isMatch) {
            matched.push(el);
        }
    }

    if (el && 'childNodes' in el) {
        const children = el.childNodes ?? [];
        for(const child of children) {
            select(child, constraints, matched);
        }
    }

    return matched;
};

/**
 * Given a Parse5 node, gets the text content viewable by a user.
 * @param {Document|ChildNode|null|undefined} el the node to compile the text of
 * @return {string} the text content
 */
const getTextContent = el => {
    const isComment = el && (el.nodeName === '#comment' || 'data' in el);
    const isText = el && 'value' in el;
    const isLine = el && el.nodeName === 'br';
    if (isText || isLine || isComment || !el) {
        return isText ? el.value : (isLine ? '\n' : '');
    }

    let childText = '';
    const children = el.childNodes ?? [];
    for(const child of children) {
        childText += getTextContent(child);
    }
    return childText;
};


/**
 * Downloads the root manifest file and returns its content.
 * @param {string} outPath the folder to download into
 * @param {string} cookie the cookie to use to download
 * @return {Promise<SteamCloudRoot|null>} the downloaded/parsed manifest
 */
const downloadRoot = async (outPath, cookie) => {
    /** @type {SteamCloudRoot} */
    const root = { games: [ ] };
    const rootHtml = await sendRequest(urlRoot, { 'Cookie': cookie });
    const rootDom = external.parse5.parse(rootHtml);

    const tables = select(rootDom, {
        tagName: 'table',
        class: x => (x?.includes('accountTable') ?? false)
    });
    const body = select(tables[0], { tagName: 'tbody' });
    if (tables.length !== 1 || body.length !== 1) {
        return null;
    }
    const rows = select(body[0], { tagName: 'tr' });
    for(const row of rows) {
        const cells = select(row, { tagName: 'td' });
        const link = select(row, { tagName: 'a' })[0];
        const url = link?.attrs.find(x => x.name === 'href')?.value ?? null;
        if (cells.length !== 4 || !url) {
            return null;
        }
        const name = getTextContent(cells[0]).trim();
        const id = url.replace(/[^\d]/g, '');
        root.games.push({
            name,
            folderName: `${name.replace(/[^\w]/g, '')}-${id}`,
            fileCount: getTextContent(cells[1]).trim(),
            fileSize: getTextContent(cells[2]).trim(),
            url
        });
    }

    await writeJson(pathJoin(outPath, fileNameRoot), root);
    return root;
};

/**
 * Downloads a particular game.
 * @param {SteamCloudGame} game the game to download
 * @param {string} outPath the folder to download into
 * @param {string} cookie the cookie to use to download
 * @return {Promise<SteamCloudGameData|null>} a promise resolving if successful
 */
const downloadGameData = async (game, outPath, cookie) => {
    if (!game.url) {
        return null;
    }

    // Parse the page into a files array
    /** @type {SteamCloudGameData} */
    const gameData = { files: [ ] };
    const gameHtml = await sendRequest(game.url, { 'Cookie': cookie });
    const gameDom = external.parse5.parse(gameHtml);
    const tables = select(gameDom, {
        tagName: 'table',
        class: x => (x?.includes('accountTable') ?? false)
    });
    const body = select(tables[0], { tagName: 'tbody' });
    if (tables.length !== 1 || body.length !== 1) {
        return null;
    }
    const rows = select(body[0], { tagName: 'tr' });
    for(const [i, row] of rows.entries()) {
        const cells = select(row, { tagName: 'td' });
        const link = select(row, { tagName: 'a' })[0];
        const url = link?.attrs.find(x => x.name === 'href')?.value ?? null;
        if (cells.length !== 5 || !url) {
            return null;
        }
        gameData.files.push({
            localName: `data-${i.toString().padStart(4, '0')}.dat`,
            folder: getTextContent(cells[0]).trim(),
            name: getTextContent(cells[1]).trim(),
            size: getTextContent(cells[2]).trim(),
            date: getTextContent(cells[3]).trim(),
            url
        });
    }

    // Download the files array
    const gamePath = pathJoin(outPath, game.folderName);
    await makeDirectory(gamePath);
    await writeJson(pathJoin(gamePath, fileNameGame), gameData);
    for(const file of gameData.files) {
        await downloadFile(file.url, pathJoin(gamePath, file.localName));
    }
    return gameData;
};


const main = async () => {
    const name = 'SteamData';
    const input = await getInput({
        name,
        help,
        inScriptable: true,
        args: [{
            name: 'output',
            shortName: 'o',
            type: 'pathFolder',
            bookmarkName: 'steamcloud-output',
            help: 'Where the files will be downloaded to.'
        }, {
            name: 'cookie',
            shortName: 'c',
            type: 'string',
            help: 'The cookie string to use to log in to steam.'
        }]
    });
    if (!input) { return; }

    const cookie = string(input.cookie);
    const outputFolder = string(input.output || './');

    if (!cookie) {
        return error('SteamCloud', 'A cookie argument is required.');
    }


    const now = new Date();
    const day = now.getDate().toString().padStart(2, '0');
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const year = now.getFullYear().toString();
    const backupName = `${year}-${month}-${day}-steam-cloud`;
    const backupPath = pathJoin(outputFolder, backupName);

    await makeDirectory(backupPath);
    const root = await downloadRoot(backupPath, cookie);
    if (!root) {
        return error('SteamCloud', 'Could Not Download/Parse Root Page.');
    }

    for(const [index, game] of root.games.entries()) {
        status(`Downloading ${index+1} of ${root.games.length}`);
        const gameData = await downloadGameData(game, backupPath, cookie);
        if (!gameData) {
            return error('SteamCloud', `Cloud Not Download: ${game.name}`);
        }
    }

    output('SteamCloud', `Downloaded all data.`);
};

main();
