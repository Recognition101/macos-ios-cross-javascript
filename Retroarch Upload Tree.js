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
    pathJoin, listFiles, isDirectory,
    getInput, string, output, uploadForm, uploadFile, status
} = require('./lib/node.js');

const uploadPath = 'upload';
const createPath = 'create';
const fileNameDenyList = new Set([ '.DS_Store', '__MACOSX' ]);

/**
 * @param {string} url the URL to send the remote commands to
 * @param {string} local the local directory we are reading
 * @param {string} remote the remote directory we are mirroring to
 * @return {Promise<void>} a promise that resolves when this completes
 */
const mirror = async (url, local, remote) => {
    const fileNames = await listFiles(local);
    for(const fileName of fileNames) {
        const filePath = pathJoin(local, fileName);
        const isDenied = fileNameDenyList.has(fileName);

        const remoteFilePath = pathJoin(remote, fileName);
        const fileIsDirectory = await isDirectory(filePath);

        if (!isDenied && fileIsDirectory) {
            status(`Creating Directory: ${remoteFilePath}`);

            await uploadForm(url + createPath, { path: remoteFilePath });
            await mirror(url, filePath, remoteFilePath);

        } else if (!isDenied) {
            status(`Copy File: ${filePath} => ${remote}`);
            await uploadFile(url + uploadPath, { path: remote }, filePath);
        }
    }
};

const main = async () => {
    const input = await getInput({
        help: 'Uploads a directory (recursively) to a given server.',
        inScriptable: true,
        args: [{
            name: 'folder',
            shortName: 'f',
            help: 'The local folder path to upload (ex: "~/Downloads/Retro/").',
            type: 'pathFolder',
            bookmarkName: 'retroarch-upload-tree-folder'
        }, {
            name: 'url',
            shortName: 'u',
            help: 'The URL to upload the folder to (ex: "10.0.1.33").',
            type: 'string'
        }, {
            name: 'path',
            shortName: 'p',
            type: 'string',
            help: 'Uploads folder here on the server (ex: "/RetroArch/").'
        }]
    });

    if (!input) { return; }

    const folder = string(input.folder);
    const serverPath = string(input.path);

    const urlArg = string(input.url);
    const urlPrefix = /^https?:[/]{2}/.test(urlArg) ? '' : 'http://';
    const urlSuffix = urlArg.endsWith('/') ? '' : '/';
    const url = urlPrefix + urlArg + urlSuffix;

    await mirror(url, folder, serverPath);

    output('Retroarch Upload Tree', 'Retroarch Tree Uploaded.');

    //const responseText = await uploadForm(
    //    url + createPath,
    //    { path: '/RetroArch/test/' });
    //const responseText = await uploadFile(
    //    url + uploadPath,
    //    { path: '/RetroArch/test' },
    //    folder);
};

main();
