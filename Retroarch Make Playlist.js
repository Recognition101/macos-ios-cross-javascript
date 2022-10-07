// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: light-brown; icon-glyph: list-alt;
/// <reference path="./types/retroarch.d.ts" />
// @ts-ignore
// eslint-disable-next-line
try { require; } catch(e) { require = importModule; }

const {
    getInput, string, output, error, status,
    pathJoin, listFiles, isFile, makeDirectory, writeJson, readJson
} = require('./lib/lib.js');

const outputName = 'config';
const playlistsName = 'playlists';

/**
 * Replaces a set of keys with their values in a given string
 * @param {ObjectMap<string>} substitutions all replacements to make
 * @param {string} string the string to replace the contents of
 * @return {string} the string with replacements
 */
const substitute = (substitutions, string) => 
    Object.keys(substitutions).reduce((out, key) =>
        out.replace(new RegExp(key, 'g'), substitutions[key]), string);

/**
 * Writes a playlist LPL file.
 * @param {string} workingPath the path to the current working directory
 * @param {RetroArch.PlaylistConfig} playlist the data describing the playlist
 * @param {ObjectMap<string>} substitutions
 */
const makePlaylist = async (workingPath, playlist, substitutions) => {
    const directoryName = substitute(substitutions, playlist.directory);
    const corePath = substitute(substitutions, playlist.corePath);
    const coreName = substitute(substitutions, playlist.coreName);
    const playlistPath = substitute(substitutions, playlist.path);
    const dbName = coreName + '.lpl';

    const outputPath = pathJoin(workingPath, outputName);
    const playlistsPath = pathJoin(outputPath, playlistsName);
    const dirPath = pathJoin(workingPath, directoryName);
    const isWad = playlist.extensions.includes('wad');

    /** @type {RetroArch.Playlist} */
    const playlistOutput = {
        version: '1.4',
        default_core_path: corePath,
        default_core_name: coreName,
        label_display_mode: 0,
        right_thumbnail_mode: 0,
        left_thumbnail_mode: 0,
        sort_mode: 0,
        items: []
    };

    for(const fileName of (await listFiles(dirPath))) {
        const dotIndex = fileName.lastIndexOf('.');
        const name = fileName.substring(0, dotIndex);
        const ext = fileName.substring(dotIndex + 1).toLowerCase();

        if (playlist.extensions.includes(ext)) {
            status(`Playlist: ${coreName}, Game: ${name}`);

            playlistOutput.items.push({
                path: substitute({ '%r': fileName }, playlistPath),
                label: name,
                core_path: corePath,
                core_name: coreName,
                crc32: 'DETECT',
                db_name: dbName
            });
        }

        if (isWad) {
            const wadName = pathJoin(fileName, 'DOOM.WAD');
            if (await isFile(pathJoin(dirPath, wadName))) {
                status(`Playlist: ${coreName}, Game: ${name}`);

                playlistOutput.items.push({
                    path: substitute({ '%r': wadName }, playlistPath),
                    label: fileName,
                    core_path: corePath,
                    core_name: coreName,
                    crc32: 'DETECT',
                    db_name: dbName
                });
            }
        }
    }

    // Manual Items
    for(const item of playlist.manual || [ ]) {
        playlistOutput.items.push({
            path: substitute(substitutions, item.path),
            label: substitute(substitutions, item.label),
            core_path: substitute(substitutions, item.core_path),
            core_name: substitute(substitutions, item.core_name),
            crc32: substitute(substitutions, item.crc32),
            db_name: substitute(substitutions, item.db_name)
        });
    }

    // Write JSON
    await writeJson(pathJoin(playlistsPath, dbName), playlistOutput);
};

const help = '' +
`Spiders files in a given working directory (WD). Outputs a file:
    WD/${outputName}/${playlistsName}/<coreName>.lpl

Containing launch directives for each file matching:
    WD/<folder>/*.<extensions>

Where <coreName>, <folder>, and <extensions> are from an RA Playlist JSON.

Setup: Manually create an RA Playlist JSON.

RA Playlist JSON Path: (Given by -c or --config flags)
RA Playlist JSON Type: ./types/retroarch.d.ts::Retroarch.MakePlaylistConfig`;

const main = async () => {
    const input = await getInput({
        name: 'Retroarch Make Playlist',
        help,
        inScriptable: true,
        args: [{
            name: 'folder',
            shortName: 'f',
            type: 'pathFolder',
            bookmarkName: 'retroarch-make-playlist-folder',
            help: 'The WD (Working Directory) to spider/output to.'
        }, {
            name: 'config',
            shortName: 'c',
            type: 'pathFile',
            bookmarkName: 'retroarch-make-playlist-config',
            help: 'The config file describing each LPL playlist to make.'
        }]
    });
    if (!input) { return; }

    const configJson = await readJson(string(input.config));
    const config = /** @type {RetroArch.MakePlaylistConfig|null} */(configJson);
    const folder = string(input.folder);

    if (!config) {
        return error('Retroarch Make Playlist', 'Could not read config.');
    }

    await makeDirectory(pathJoin(folder, outputName));
    await makeDirectory(pathJoin(pathJoin(folder, outputName), playlistsName));

    for(const playlist of config.playlists) {
        await makePlaylist(folder, playlist, config.substitutions);
    }

    output('Retroarch Make Playlist', `Created: ${config.playlists.length}`);
};

main();
