//@ts-ignore
//eslint-disable-next-line
try { require; } catch(e) { require = () => importModule('./lib-scriptable'); }
module.exports = require('./lib-node.js');

/**
 * Creates a CRC32 table.
 * @return {Int32Array} the CRC32 table
 */
const makeCrc32Table = () => {
    const table = new Array(256);
    let c = 0;

    for(let n =0; n < 256; n += 1){
        c = n;
        c = ((c & 1) ? (-306674912 ^ (c >>> 1)) : (c >>> 1));
        c = ((c & 1) ? (-306674912 ^ (c >>> 1)) : (c >>> 1));
        c = ((c & 1) ? (-306674912 ^ (c >>> 1)) : (c >>> 1));
        c = ((c & 1) ? (-306674912 ^ (c >>> 1)) : (c >>> 1));
        c = ((c & 1) ? (-306674912 ^ (c >>> 1)) : (c >>> 1));
        c = ((c & 1) ? (-306674912 ^ (c >>> 1)) : (c >>> 1));
        c = ((c & 1) ? (-306674912 ^ (c >>> 1)) : (c >>> 1));
        c = ((c & 1) ? (-306674912 ^ (c >>> 1)) : (c >>> 1));
        table[n] = c;
    }

    return new Int32Array(table);
};

/**
 * Calculates the CRC32 value of a given string or byte array.
 * @param {Int32Array} table the CRC32 table to use to generate
 * @param {string|Uint8Array|number[]} input the string/bytes to hash
 * @param {boolean} [isSimple] if true, only compute a simple CRC
 * @return {number} the CRC32 value
 */
const getCrc32 = (table, input, isSimple) => {
    let output = -1;
    let i = 0;
    const isNumeric = typeof input !== 'string';

    while(i < input.length) {
        let c = isNumeric ? input[i++] : input.charCodeAt(i++);
        if (isSimple || c < 0x80) {
            output = (output >>> 8) ^
                table[(output ^ c) & 0xFF];
        } else if (c < 0x800) {
            output = (output >>> 8) ^
                table[(output ^ (192 | ((c >> 6) & 31))) & 0xFF];
            output = (output >>> 8) ^
                table[(output ^ (128 | (c & 63))) & 0xFF];
        } else if (c >= 0xD800 && c < 0xE000) {
            c = (c & 1023) + 64;
            const d = (isNumeric ? input[i++] : input.charCodeAt(i++)) & 1023;
            output = (output >>> 8) ^
                table[(output ^ (240 | ((c >> 8) & 7))) & 0xFF];
            output = (output >>> 8) ^
                table[(output ^ (128 | ((c >> 2) & 63))) & 0xFF];
            output = (output >>> 8) ^
                table[
                    (output ^ (128 | ((d >> 6) & 15) | ((c & 3) << 4))) & 0xFF
                ];
            output = (output >>> 8) ^
                table[(output ^ (128 | (d & 63))) & 0xFF];
        } else {
            output = (output >>> 8) ^
                table[(output ^ (224 | ((c >> 12) & 15))) & 0xFF];
            output = (output >>> 8) ^
                table[(output ^ (128 | ((c >> 6) & 63))) & 0xFF];
            output = (output >>> 8) ^
                table[(output ^ (128 | (c & 63))) & 0xFF];
        }
    }
    return output ^ -1;
};

module.exports.makeCrc32Table = makeCrc32Table;
module.exports.getCrc32 = getCrc32;
