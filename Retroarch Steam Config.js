// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: light-brown; icon-glyph: gamepad;
/// <reference path="./types/retroarch.d.ts" />
// @ts-ignore
// eslint-disable-next-line
try { require; } catch(e) { require = importModule; }
const {
    getInput, string, error, stringToBytes, output,
    readJson, writeBytes, makeDirectory, listFiles, pathJoin
} = require('./lib/lib.js');

const nameOutput = 'config';
const nameOutputVdf = 'shortcuts.vdf';

const vdfTypeObject = 0x00;
const vdfTypeString = 0x01;
const vdfTypeInt = 0x02;
const vdfEndObject = 0x08;
const vdfEndString = 0x00;
const vdfEndPropertyName = 0x00;

/**
 * @typedef {Object} ByteBuilder
 * @prop {Uint8Array} data the data we are constructing
 * @prop {number} offset the current index we are writing to
 */

/**
 * Given a string, replace all keys of a map with their values.
 * @param {ObjectMap<string>} map replace all of these keys with these values
 * @param {string} str make the replacements within this string
 * @return {string} the string with substitutions made
 */
const substitute = (map, str) => 
    Object.entries(map).reduce(
        (val, [k, v]) => val.replace(new RegExp(k, 'g'), v),
        str
    );

/**
 * @see github.com/tirish/steam-shortcut-editor/blob/master/lib/writer.js
 * @param {JsonDate} json the object to create a VDF from
 * @param {ByteBuilder} [vdf] the existing data for the vdf (optional)
 * @return {ByteBuilder} the bytes for the created VDF
 */
const makeVdf = (json, vdf) => {
    vdf = vdf || { data: new Uint8Array(1024 * 10), offset: 0 }; // 10kb default

    if (json === null || json === undefined) {
        appendBytes(vdf, stringToBytes(''));
        appendByte(vdf, vdfEndString);

    } else if (json instanceof Date) {
        writeInt32(vdf, Math.floor(json.valueOf() / 1000));

    } else if (typeof json === 'boolean') {
        writeInt32(vdf, json ? 1 : 0);

    } else if (typeof json === 'string') {
        appendBytes(vdf, stringToBytes(json));
        appendByte(vdf, vdfEndString);

    } else if (typeof json === 'number') {
        json = !isNaN(json) && isFinite(json) ? json : 0;
        writeInt32(vdf, json);

    } else {
        const entries = Array.isArray(json)
            ? json.entries()
            : Object.entries(json);

        for(const [ key, value ] of entries) {
            const keyString = typeof key === 'string' ? key : key.toString();

            const type = 
                value === null || value === undefined ? vdfTypeString :
                typeof value === 'string' ? vdfTypeString :
                typeof value === 'boolean' ? vdfTypeInt :
                typeof value === 'number' ? vdfTypeInt :
                value instanceof Date ? vdfTypeInt :
                vdfTypeObject;

            appendByte(vdf, type);
            appendBytes(vdf, stringToBytes(keyString));
            appendByte(vdf, vdfEndPropertyName);
            makeVdf(value, vdf);
        }

        appendByte(vdf, vdfEndObject);
    }

    return vdf;
};

/**
 * Writes a 32-bit little-endian integer to a byte builder.
 * @param {ByteBuilder} bytes the object to write the integer to
 * @param {number} value the 32-bit integer to write
 */
const writeInt32 = (bytes, value) => {
    value = +value;
    appendByte(bytes, value & 0xff);
    appendByte(bytes, value >>> 8);
    appendByte(bytes, value >>> 16);
    appendByte(bytes, value >>> 24);
};

/**
 * @param {ByteBuilder} bytes the stream of bytes to write to.
 * @param {Uint8Array|number[]} data the data to write to the builder
 */
const appendBytes = (bytes, data) => {
    for(const byte of data) {
        appendByte(bytes, byte);
    }
};

/**
 * @param {ByteBuilder} bytes the stream of bytes to write to.
 * @param {number} byte the single byte to add to the builder
 */
const appendByte = (bytes, byte) => {
    if (bytes.offset >= bytes.data.length) {
        const newData = new Uint8Array(bytes.data.length * 2);
        newData.set(bytes.data);
        bytes.data = newData;
    }

    bytes.data[bytes.offset] = byte;
    bytes.offset += 1;
};

/**
 * Given a builder, gets the correctly sized sub-array containing written data.
 * @param {ByteBuilder} builder the byte builder to get the data from
 * @return {Uint8Array} the correctly sized data
 */
const getBytes = builder => builder.data.subarray(0, builder.offset);

const help = '' +
`Spiders ROMs in a given working directory (WD).
    Outputs a file: WD/${nameOutput}/${nameOutputVdf}
    It belongs at: %STEAM_INSTALL$\\Steam\\userdata\\%USER_ID%\\config

The file contains Steam shortcuts, one per file: WD/<directory>/*.<extensions>
    Each shortcut contains:
        <exe>: The executable to run for the shortcut.
        <dirExe>: The directory we run the exe within.
        <tags>: Any steam tags to apply to this shortcut.

Where all <variables> are from a RetroArch Steam JSON.

Setup: Manually create a RetroArch Steam JSON.

RetroArch Steam JSON Path: (Provided with -c or --config flag)
RetroArch Steam JSON Type: $/types/retroarch.d.ts::Retroarch.SteamConfig`;

const main = async () => {
    const input = await getInput({
        name: 'Retroarch Steam Config',
        help,
        inScriptable: true,
        args: [{
            name: 'folder',
            shortName: 'f',
            type: 'pathFolder',
            bookmarkName: 'retroarch-steam-config-folder',
            help: 'The WD (Working Directory) to spider roms in and output to.'
        }, {
            name: 'config',
            shortName: 'c',
            type: 'pathFile',
            bookmarkName: 'retroarch-steam-config-config',
            help: 'The config file describing how to run each ROM file.'
        }]
    });

    if (!input) { return; }

    const json = await readJson(string(input.config));
    const config = /** @type {RetroArch.SteamConfig|null} */(json);
    const folder = string(input.folder);

    if (!config) {
        return error('Retroarch Steam Config', 'Could not read config.');
    }

    const subMap = config.substitutions;
    const pathOutput = pathJoin(folder, nameOutput);
    const pathVdf = pathJoin(pathOutput, nameOutputVdf);

    /** @type {RetroArch.SteamShortcutsVdf} */
    const vdfJson = { shortcuts: [ ] };

    await makeDirectory(pathOutput);

    for(const emulator of config.emulators) {
        const pathRoms = pathJoin(folder, emulator.directory);
        const suffixes = emulator.extensions.map(x => '.' + x.toLowerCase());

        for(const fileName of await listFiles(pathRoms)) {
            subMap['%r'] = fileName;
            const fileLower = fileName.toLowerCase();
            const suffix = suffixes.find(x => fileLower.endsWith(x));

            if (typeof suffix === 'string') {
                const name = fileName
                    .substring(0, fileName.length - suffix.length)
                    .replace(/\(.*?\)|\[.*?\]/g, '')
                    .trim();

                vdfJson.shortcuts.push({
                    AppName: name,
                    exe: substitute(subMap, emulator.exe),
                    StartDir: substitute(subMap, emulator.dirExe),
                    IsHidden: false,
                    AllowDesktopConfig: true,
                    OpenVR: false,
                    tags: emulator.tags,
                    LaunchOptions: substitute(subMap, emulator.opts)
                });
            }
        }
    }

    const bytes = getBytes(makeVdf(/** @type {any} */(vdfJson)));
    await writeBytes(pathVdf, bytes);
    output('Retroarch Steam Config', `Wrote ${bytes.length} byte VDF file.`);
};

main();
