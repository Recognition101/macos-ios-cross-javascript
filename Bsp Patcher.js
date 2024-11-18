// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: light-brown; icon-glyph: band-aid;
// share-sheet-inputs: file-url;
// @ts-ignore
// eslint-disable-next-line
try { require; } catch(e) { require = importModule; }

const {
    string, getInput, readBytes, writeBytes, output,
    pathJoin, makeCrc32Table, getCrc32, error
} = require('./lib/lib.js');

const PATCH_COMMAND_COPY_FROM_SOURCE = 0;
const PATCH_COMMAND_COPY_FROM_PATCH = 1;
const PATCH_COMMAND_COPY_FROM_SOURCE_AT_OFFSET = 2;
const PATCH_COMMAND_COPY_FROM_TARGET_AT_OFFSET = 3;

/**
 * Reads a 32-bit integer from a given index.
 * @param {ByteBuilder} stream the stream to read from
 * @param {number} index the position to read 4 bytes from
 * @return {number} the 32-bit integer
 */
const readInt32At = (stream, index) => {
    const b0 = stream.data[index + 0] << 0;
    const b1 = stream.data[index + 1] << 8;
    const b2 = stream.data[index + 2] << 16;
    const b3 = stream.data[index + 3] << 24;
    return (b0 | b1 | b2 | b3) >>> 0;
};

/**
 * Reads a byte from a byte builder, advancing the index.
 * @param {ByteBuilder} stream the stream to read from
 * @return {number} the value that was read
 */
const readByte = stream => {
    const result = stream.data[stream.offset];
    stream.offset += 1;
    return result;
};

/**
 * Reads the next unsigned integer from the stream.
 * @param {ByteBuilder} stream the stream to read from
 * @return {number} the unsigned integer that was read
 */
const readInteger = stream => {
    let value = 0;
    for(let shift = 0, next = 0; !(next & 0x80); shift += 7) {
        next = readByte(stream);
        value += (next ^ 0x80) << shift;
    }
    return value;
};

/**
 * Reads the next signed integer from the stream.
 * @param {ByteBuilder} stream the stream to read from
 * @return {number} the signed integer that was read
 */
const readSignedInteger = stream => {
    const bytes = readInteger(stream);
    const value = bytes >> 1;
    return bytes & 1 ? -value : value;
};

/**
 * Writes a byte to a byte builder, advancing the index.
 * @param {ByteBuilder} stream the stream to write to
 * @param {number} byte the byte to write
 */
const writeByte = (stream, byte) => {
    stream.data[stream.offset] = byte;
    stream.offset += 1;
};

/**
 * Patches a file.
 * @param {Int32Array} c3Table a Crc32 Table for reuse
 * @param {Uint8Array} sourceData the bytes making up the file to patch
 * @param {Uint8Array} patchData the patch file to apply
 * @return {Result<Uint8Array>} the patched file
 */
const runPatcher = (c3Table, sourceData, patchData) => {
    const patch = { data: patchData, offset: 0 };

    const isValidB0 = readByte(patch) === 0x42;
    const isValidB1 = readByte(patch) === 0x50;
    const isValidB2 = readByte(patch) === 0x53;
    const isValidB3 = readByte(patch) === 0x31;

    if (!isValidB0 || !isValidB1 || !isValidB2 || !isValidB3) {
        return { error: 'Patch file contains a malformed header.' };
    }

    const sourceLength = readInteger(patch);
    if (sourceLength !== sourceData.length) {
        return { error: 'Patch is not intended for file (length mismatch).' };
    }

    const sourceCrc32 = getCrc32(c3Table, sourceData, true) >>> 0;
    const patchCrc32 = readInt32At(patch, patch.data.length - 12);
    if (sourceCrc32 !== patchCrc32) {
        return { error: 'Patch is not intended for file (CRC32 mismatch).' };
    }

    const targetLength = readInteger(patch);
    const metadataLength = readInteger(patch);
    patch.offset = patch.offset + metadataLength;

    const target = { data: new Uint8Array(targetLength), offset: 0 };
    const source = { data: sourceData, offset: 0 };
    const targetReader = { data: target.data, offset: 0 };

    while(patch.offset < patch.data.length - 12) {
        const commandAndLength = readInteger(patch);
        const command = commandAndLength & 3;
        const length = (commandAndLength >> 2) + 1;

        if (command === PATCH_COMMAND_COPY_FROM_SOURCE) {
            for(let i = 0; i < length; i += 1) {
                writeByte(target, sourceData[target.offset]);
            }
        } else if (command === PATCH_COMMAND_COPY_FROM_PATCH) {
            for(let i = 0; i < length; i += 1) {
                writeByte(target, readByte(patch));
            }
        } else if (command === PATCH_COMMAND_COPY_FROM_SOURCE_AT_OFFSET) {
            source.offset += readSignedInteger(patch);
            for(let i = 0; i < length; i += 1) {
                writeByte(target, readByte(source));
            }
        } else if (command === PATCH_COMMAND_COPY_FROM_TARGET_AT_OFFSET) {
            targetReader.offset += readSignedInteger(patch);
            for(let i = 0; i < length; i += 1) {
                writeByte(target, readByte(targetReader));
            }
        }
    }

    return { value: target.data };
};

const main = async () => {
    const input = await getInput({
        name: 'Rom Patcher',
        help: 'Patch a given input file with a given patch.',
        inScriptable: true,
        args: [{
            name: 'input',
            shortName: 'i',
            type: 'pathFile',
            bookmarkName: 'bps-patcher-input-file',
            help: 'The file to read and patch.'
        }, {
            name: 'patch',
            shortName: 'p',
            type: 'pathFile',
            bookmarkName: 'bps-patcher-patch-file',
            help: 'The patch to apply to the input.',
            share: true
        }, {
            name: 'output',
            shortName: 'o',
            type: 'pathFolder',
            bookmarkName: 'bps-output-folder',
            help: 'The folder to write the target to.'
        }, {
            name: 'url',
            shortName: 'u',
            type: 'string',
            help: 'The URL to append to the name (optional).'
        }]
    });
    if (!input) { return; }

    const pathInput = string(input.input);
    const pathPatch = string(input.patch);
    const pathOutput = string(input.output);
    const url = string(input.url);

    const fileInput = await readBytes(pathInput);
    const filePatch = await readBytes(pathPatch);
    if (!fileInput || !filePatch) {
        const type = !fileInput ? 'input' : 'patch';
        const pathError = !fileInput ? pathInput : pathPatch;
        return error(
            'BSP Patcher',
            `Could not read ${type} file at: ${pathError}`
        );
    }

    const c3Table = makeCrc32Table();
    const result = runPatcher(c3Table, fileInput, filePatch);
    if (result.error !== undefined) {
        return error('BSP Patcher', result.error);
    }

    const id = url.match(/id=(\d+)/)?.[1] ?? '';
    const namePrefix = pathPatch.replace(/^.*\/|\.bps$/gi, '');
    const nameSuffix = pathInput.replace(/^.*\./, '');
    const name = `${namePrefix}${id ? ' - ' : ''}${id}.${nameSuffix}`;
    const pathOutputFile = pathJoin(pathOutput, name);

    await writeBytes(pathOutputFile, result.value);

    output('BSP Patcher', `Output file: ${pathOutputFile}`);
};

main();
