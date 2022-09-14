// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: light-brown; icon-glyph: download;
// share-sheet-inputs: plain-text, url;
/// <reference path="./types/retroarch.d.ts" />
// @ts-ignore
// eslint-disable-next-line
try { require; } catch(e) { require = importModule; }

const {
    getInput,
    readJson,
    string,
    error,
    pathJoin,
    makeDirectory,
    downloadJson,
    downloadFile,
    encodeURIComponent,
    output
} = require('./lib/lib.js');

/**
 * Downloads a folder from a RetroArch file server.
 * @param {string} ip the IP address that the file server is running on
 * @param {string} pathInput the path to download from
 * @param {string} pathOutput the path to download to
 * @return {Promise<number>} a promise resolving to the download count
 */
const downloadFolder = async (ip, pathInput, pathOutput) => {
    const urlList = `http://${ip}/list?path=${encodeURIComponent(pathInput)}`;
    const listAny = await downloadJson(urlList);
    const list = /** @type {RetroArch.FileServerList|null} */(listAny);

    const urlDownload = `http://${ip}/download?path=`;
    let count = 0;

    for(const item of list ?? [ ]) {
        const pathOutputItem = pathJoin(pathOutput, item.name);
        const pathInputItem = pathJoin(pathInput, item.name);

        if (item.size) {
            const urlItem = urlDownload + encodeURIComponent(pathInputItem);
            await downloadFile(urlItem, pathOutputItem);
            count += 1;

        } else {
            await makeDirectory(pathOutputItem);
            count += await downloadFolder(ip, pathInputItem, pathOutputItem);
        }
    }

    return count;
};

const pathDownloadJson = '$/retroarch/download-config.json';

const help = '' +
`Given a RetroArch file server operating at <ip>, downloads all files from
<pathRemote> to "<pathLocal>/<currentDateTime>/<pathRemote>/".

Note that while all variables above can be specified as arguments, some may
optionally be provided within the RetroArch Download JSON.

Setup: (Optional) Manually create a RetroArch Download JSON.

RetroArch Download JSON Path: ${pathDownloadJson}
RetroArch Download JSON Type: $/types/retroarch.d.ts::RetroArch.DownloadConfig`;

/**
 * Downloads a tree at a particular path from a RetroArch server.
 */
const main = async () => {
    const input = await getInput({
        name: 'Retroarch Download Tree',
        help,
        inScriptable: true,
        args: [{
            name: 'pathLocal',
            shortName: 'l',
            type: 'pathFolder',
            bookmarkName: 'retroarch-download-tree-output-folder',
            help: 'The directory to download the file tree to.'
        }, {
            name: 'ip',
            shortName: 'i',
            type: 'string',
            help: 'The IP Address the RetroArch server is running on.'
        }, {
            name: 'pathRemote',
            shortName: 'r',
            type: 'string',
            help: 'The path to the folder tree to download (must end in "/").'
        }]
    });
    if (!input) { return; }

    const configJson = await readJson(string(pathDownloadJson));
    const config = /** @type {RetroArch.DownloadConfig|null} */(configJson);

    const pathLocal = string(input.pathLocal);
    const ip = string(input.ip) || config?.ip || '';
    const pathRemoteRaw = string(input.pathRemote) || config?.pathRemote || '';
    const pathRemotes = typeof pathRemoteRaw === 'string'
        ? [ pathRemoteRaw ]
        : pathRemoteRaw;

    if (!ip) {
        return error('Retroarch Download Tree', 'No IP Address Provided.');
    }

    const isEmptyRemote = pathRemotes.length === 1 && pathRemotes[0] === '';
    if (pathRemotes.length === 0 || isEmptyRemote) {
        return error('Retroarch Download Tree', 'No Remote Path Provided.');
    }

    const now = (new Date()).toISOString().replace(/[:.]/g, '-');
    const pathOutputRoot = pathJoin(pathLocal, now);
    await makeDirectory(pathOutputRoot);

    let count = 0;
    for(const pathRemote of pathRemotes) {
        const name = pathRemote.replace(/^\/|\/$/g, '').replaceAll('/', '-');
        const pathOutput = pathJoin(pathOutputRoot, name);
        await makeDirectory(pathOutput);
        count += await downloadFolder(ip, pathRemote, pathOutput);
    }

    output('Retroarch Download Tree', `Downloaded ${count} files.`);
};

main();
