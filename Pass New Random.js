// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: purple; icon-glyph: key; share-sheet-inputs: plain-text, url;
// @ts-ignore
// eslint-disable-next-line
try { require; } catch(e) { require = importModule; }

const { getInput, copy, output } = require('./lib/lib.js');

/**
 * @typedef {Object} PwGenElement an element we can add to a password
 * @prop {string} string the text to add to the password
 * @prop {boolean} [vowel] true if the text is a vowel
 * @prop {boolean} [dipthong] true if the text is a dipthong
 * @prop {boolean} [consonant] true if the text is a consonant
 * @prop {boolean} [notFirst] true if the password cannot start with this
 */

/** @type {PwGenElement[]} */
const elements = [
    { string: 'a',  vowel: true },
    { string: 'ae', vowel: true, dipthong: true },
    { string: 'ah', vowel: true, dipthong: true },
    { string: 'ai', vowel: true, dipthong: true },
    { string: 'b',  consonant: true },
    { string: 'c',  consonant: true },
    { string: 'ch', consonant: true, dipthong: true },
    { string: 'd',  consonant: true },
    { string: 'e',  vowel: true },
    { string: 'ee', vowel: true, dipthong: true },
    { string: 'ei', vowel: true, dipthong: true },
    { string: 'f',  consonant: true },
    { string: 'g',  consonant: true },
    { string: 'gh', consonant: true, dipthong: true, notFirst: true },
    { string: 'h',  consonant: true },
    { string: 'i',  vowel: true },
    { string: 'ie', vowel: true, dipthong: true },
    { string: 'j',  consonant: true },
    { string: 'k',  consonant: true },
    { string: 'l',  consonant: true },
    { string: 'm',  consonant: true },
    { string: 'n',  consonant: true },
    { string: 'ng', consonant: true, dipthong: true, notFirst: true },
    { string: 'o',  vowel: true },
    { string: 'oh', vowel: true, dipthong: true },
    { string: 'oo', vowel: true, dipthong: true},
    { string: 'p',  consonant: true },
    { string: 'ph', consonant: true, dipthong: true },
    { string: 'qu', consonant: true, dipthong: true},
    { string: 'r',  consonant: true },
    { string: 's',  consonant: true },
    { string: 'sh', consonant: true, dipthong: true},
    { string: 't',  consonant: true },
    { string: 'th', consonant: true, dipthong: true},
    { string: 'u',  vowel: true },
    { string: 'v',  consonant: true },
    { string: 'w',  consonant: true },
    { string: 'x',  consonant: true },
    { string: 'y',  consonant: true },
    { string: 'z',  consonant: true }
];

const symbols = '!"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~';

const main = async () => {
    const input = await getInput({
        name: 'Pass New Random',
        help: 'Given some rules, generate a random pronounceable password.',
        inScriptable: false,
        args: [{
            name: 'length',
            shortName: 'l',
            help: 'The length of the password (22).',
            type: 'string'
        }, {
            name: 'capital',
            shortName: 'c',
            help: 'A flag to include at least one capital letter.',
            type: 'boolean'
        }, {
            name: 'symbol',
            shortName: 's',
            help: 'A flag to include at least one symbol.',
            type: 'boolean'
        }, {
            name: 'digit',
            shortName: 'd',
            help: 'A flag to include at least one digit.',
            type: 'boolean'
        }]
    });

    if (!input) { return; }

    const length = Number(input.length) || 22;
    const capital = Boolean(input.capital);
    const symbol = Boolean(input.symbol);
    const digit = Boolean(input.digit);

    let password = /** @type {string|null} */(null);

    while(!password) {
        password = pwGen(length, capital, symbol, digit);
    }

    copy(password);
    output('Pass New Random', 'New password copied to clipboard.');
};

/**
 * Generates a password.
 * @see https://github.com/jbernard/pwgen/blob/master/pw_phonemes.c
 * @param {number} length the string length of the password
 * @param {boolean} usesCapitals true if this password requires a capital
 * @param {boolean} usesSymbols true if this password requires a symbol
 * @param {boolean} usesDigits true if this password requires a digit
 * @return {string|null} the password, or null if one couldn't be created
 */
const pwGen = (length, usesCapitals, usesSymbols, usesDigits) => {
    let usedCapital = false;
    let usedSymbol = false;
    let usedDigit = false;

    let isFirst = true;
    let previousEl = /** @type {PwGenElement|null} */(null);

    let password = '';
    let isVowel = Math.random() < 0.5;

    while(password.length < length) {
        const el = elements[Math.floor(Math.random() * elements.length)];
        const isPreviousVowel = previousEl && previousEl.vowel;

        if (el.vowel && !isVowel) {
            continue;
        }
        if (isFirst && el.notFirst) {
            continue;
        }
        if (previousEl && previousEl.vowel && el.vowel && el.dipthong) {
            continue;
        }
        if (password.length + el.string.length > length) {
            continue;
        }

        if (usesCapitals && (isFirst || el.consonant) && Math.random() < 0.2) {
            const prefixCapital = el.string.charAt(0).toUpperCase();
            password += prefixCapital + el.string.slice(1);
            usedCapital = true;
        } else {
            password += el.string;
        }

        if (password.length >= length) {
            break;
        }

        if (usesDigits && !isFirst && Math.random() < 0.3) {
            password += Math.floor(Math.random() * 10).toString();
            usedDigit = true;
            isFirst = true;
            isVowel = Math.random() < 0.5;
            continue;
        }

        if (usesSymbols && !isFirst && Math.random() < 0.2) {
            const symbolIndex = Math.floor(Math.random() * symbols.length);
            password += symbols.charAt(symbolIndex);
            usedSymbol = true;
        }

        isVowel = (
            !isVowel ? true :
            isPreviousVowel || el.dipthong || Math.random() < 0.3 ? false :
            true);

        isFirst = false;
        previousEl = el;
    }

    const satisfiesConstraints = (
        (usedCapital || !usesCapitals) &&
        (usedSymbol || !usesSymbols) &&
        (usedDigit || !usesDigits));

    return satisfiesConstraints ? password : null;
};

main();

