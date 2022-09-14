// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// always-run-in-app: true; icon-color: purple;
// icon-glyph: pencil-alt; share-sheet-inputs: plain-text;
// @ts-ignore
// eslint-disable-next-line
try { require; } catch(e) { require = importModule; }

const {
    getInput, string, error, paste, readText, log
} = require('./lib/lib.js');

/**
 * Computes the edit distance between two strings.
 * @see https://en.wikipedia.org/wiki/Damerau–Levenshtein_distance
 * @param {string} a the first string
 * @param {string} b the second string
 */
const getEditDistance = (a, b) => {
    if (a.length === 0) { return b.length; }
    if (b.length === 0) { return a.length; }

    const matrix = [];
    for (let i = 0; i <= b.length; i += 1) { matrix[i] = [i]; }
    for (let j = 0; j <= a.length; j += 1) { matrix[0][j] = j; }

    for (let i = 1; i <= b.length; i += 1) {
        for (let j = 1; j <= a.length; j += 1) {
            if (b.charAt(i-1) === a.charAt(j-1)) {
                matrix[i][j] = matrix[i-1][j-1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i-1][j-1] + 1, // substitution
                    matrix[i][j-1] + 1,   // insertion
                    matrix[i-1][j] + 1);  // deletion
            }
        }
    }

    return matrix[b.length][a.length];
};

/**
 * Simplifies a string. Similar values of `str` will return the same simplified
 * return value.
 * @param {string} str the string to simplify
 * @return {string} a value that similar `str` values will also return
 */
const simplify = str => str.replace(/[aeiouy0-9 _]/g, '');

const main = async () => {
    const input = await getInput({
        name: 'Word Suggest',
        help: 'Gets similar words to what was typed.',
        inScriptable: true,
        args: [{
            name: 'word',
            shortName: 'w',
            help: 'The word whose neighbors we will find.',
            type: 'string',
            share: true
        }]
    });
    if (!input) { return; }

    const dictText = await readText('$/lib/data/dict.txt');

    if (!dictText) {
        return error('Word Suggest', 'Could not read dict.txt');
    }

    // Edit Distance Suggestion
    const targetWord = string(input.word) || paste();
    const words = dictText.split('\n');
    const scores = words
        .map(word => ({ distance: getEditDistance(word, targetWord), word }))
        .sort((x, y) => x.distance - y.distance);

    for(let i=0; i < 5; i += 1) { log(scores[i].word); }

    // Bad Hash Suggestion
    const hashes = /** @type {{[hash: string]: string[]}} */({ });
    for(const word of words) {
        const hash = simplify(word);
        hashes[hash] = hashes[hash] || [];
        hashes[hash].push(word);
    }
    const similarWords = hashes[simplify(targetWord)] || [];
    for(const similarWord of similarWords) { log(similarWord); }
};

main();
