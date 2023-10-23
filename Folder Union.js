// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: light-brown; icon-glyph: folder-plus;
// @ts-ignore
// eslint-disable-next-line
try { require; } catch(e) { require = importModule; }

const {
    string, getInput, output,
    pathJoin, listFiles, copyFile, isFile, getFileModificationDate
} = require('./lib/lib.js');

const help = `Given two folders, populates each folder with the union of their
files, keeping the latest-modified-date file in the case of name conflicts.
Note that this script only operates at one level, it is not recursive.`;

/**
 * Handles copying a single file depending on presence and modification date.
 * @param {string} fileName the file present in either `pathA`, `pathB`, or both
 * @param {string} pathA the path to the first folder
 * @param {string} pathB the path to the second folder
 * @param {Set<string>} filesA a set of all file names in `pathA`
 * @param {Set<string>} filesB a set of all file names in `pathB`
 * @return {Promise<void>} a promise resolving after the copy
 */
const unionFile = async (fileName, pathA, pathB, filesA, filesB) => {
    const inA = filesA.has(fileName);
    const inB = filesB.has(fileName);
    const pathFileA = pathJoin(pathA, fileName);
    const pathFileB = pathJoin(pathB, fileName);
    const isFolderA = inA && !(await isFile(pathFileA));
    const isFolderB = inB && !(await isFile(pathFileB));

    if (isFolderA || isFolderB) {
        return;
    }

    const dateA = inA ? (await getFileModificationDate(pathFileA)) : null;
    const dateB = inB ? (await getFileModificationDate(pathFileB)) : null;
    const timeA = dateA?.getTime();
    const timeB = dateB?.getTime();
    const inBoth = typeof timeA === 'number' && typeof timeB === 'number';
    const isNewA = inBoth && timeA > timeB;

    if ((inA && !inB) || (inBoth && isNewA)) {
        await copyFile(pathFileA, pathFileB);
    }
    if ((!inA && inB) || (inBoth && !isNewA)) {
        await copyFile(pathFileB, pathFileA);
    }
};

const main = async () => {
    const input = await getInput({
        name: 'Folder Sync',
        help,
        inScriptable: true,
        args: [{
            name: 'folderA',
            shortName: 'a',
            type: 'pathFolder',
            bookmarkName: 'folder-union-folder-a',
            help: 'The first folder whose contents to union.'
        }, {
            name: 'folderB',
            shortName: 'b',
            type: 'pathFolder',
            bookmarkName: 'folder-union-folder-b',
            help: 'The second folder whose contents to union.'
        }]
    });
    if (!input) { return; }

    const pathA = string(input.folderA);
    const pathB = string(input.folderB);
    const filesA = new Set(await listFiles(pathA));
    const filesB = new Set(await listFiles(pathB));

    const filesAll = new Set();
    filesA.forEach(a => filesAll.add(a));
    filesB.forEach(b => filesAll.add(b));

    for(const fileName of filesAll) {
        await unionFile(fileName, pathA, pathB, filesA, filesB);
    }

    output('Folder Union', `Both folders now contain the same contents.`);
};

main();
