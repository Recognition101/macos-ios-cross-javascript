// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: light-brown; icon-glyph: tv;
// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: purple; icon-glyph: tv;

///<reference path="./types/tv.d.ts" />
// @ts-ignore
// eslint-disable-next-line
try { require; } catch(e) { require = importModule; }

const {
    getInput,
    string,
    pathJoin,
    listFiles,
    moveFile,
    output
} = require('./lib/lib.js');

const help = `Given a string $name, finds all files in a given directory that
have the "S\\d\\dE\\d\\d" (where \\d is any digit) sub-string in their name,
and rename that file to "$name S\\d\\dE\\d\\d.extension".
`;

const nameParser = /(S\d+E\d+).*?(?:(\.[^.]*))?$/;

const main = async () => {
    const input = await getInput({
        name: 'TV Renamer',
        help,
        inScriptable: false,
        args: [{
            name: 'folder',
            shortName: 'f',
            help: 'The folder to look within (not recursively).',
            type: 'pathFolder',
            bookmarkName: 'tv-renamer-folder'
        }, {
            name: 'name',
            shortName: 'n',
            help: 'The name of the show (will prefix each matching file).',
            type: 'string'
        }]
    }, true);

    if (!input) { return; }

    const showName = string(input.name);
    const pathRoot = string(input.folder);

    const files = await listFiles(pathRoot);
    let fileCount = 0;
    for(const file of files) {
        const [ _, key, ext ] = file.match(nameParser) ?? [ null, null, null ];
        if (key) {
            const pathOld = pathJoin(pathRoot, file);
            const pathNew = pathJoin(pathRoot, `${showName} ${key}${ext}`);
            await moveFile(pathOld, pathNew);
            fileCount += 1;
        }
    }

    output('TV Renamer', `Renamed ${fileCount} episode(s).`);
};

main();
