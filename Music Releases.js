// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: yellow; icon-glyph: compact-disc;

///<reference path="./types/LastFm.d.ts" />
// @ts-ignore
// eslint-disable-next-line
try { require; } catch(e) { require = () => importModule('lib/scriptable'); }

const { getInput, downloadText, readJson, log } = require('./lib/node.js');

const cosUrl = 'https://consequence.net/upcoming-releases/';

// Regular Expression Strings
const regexMonth = [
    'January', 'February', 'March', 'April', 'May', 'June', 'July',
    'August', 'September', 'October', 'November', 'December'
].join('|');
const regexDateString = `(${regexMonth})\\s+(\\d+)`;
const regexTagString = '<strong.*?>(.*?)<\\/strong>|<em.*?>(.*?)<\\/em>';
const regexAllString = regexDateString + '|' + regexTagString;

// Regular Expressions
const regexAll = new RegExp(regexAllString, 'g');
const regexTag = new RegExp(regexTagString);
const regexDate = new RegExp(regexDateString);

/**
 * Normalizes a string for matching.
 * @param {string} s the string to normalize
 * @return {string} the normalized string
 */
const normalize = s => s.toLowerCase().replace(/[^A-Za-z0-9]/g, '');

const pathArtists = '$/music/artists.json';

const help = `Downloads and displays a list of upcoming album releases.
Only album releases by bands from the Artists JSON will be displayed.

Setup: Manually create the Artists JSON file.

Artists JSON Path: ${pathArtists};
Artists JSON Type: $/types/LastFm.d.ts::LastFm.JsonArtists`;

const main = async () => {
    const input = await getInput({ help, inScriptable: true, args: [ ] });
    if (!input) { return; }

    const html = await downloadText(cosUrl);
    const lines = (html || '').match(regexAll) || [ ];

    const artistJsonRaw = await readJson(pathArtists);
    const artistJson = /** @type {LastFm.JsonArtists|null} */(artistJsonRaw);
    const artists = artistJson?.artists ?? [ ];
    const artistsSet = new Set(artists.map(artist => normalize(artist)));

    let curDate = 'RECENT';
    let curArtist = '';

    lines.forEach(line => {
        const dateMatch = line.match(regexDate);
        if (dateMatch) {
            curDate = dateMatch[0];
        } else {
            const [ , artist, album ] = (line.match(regexTag) || [ ]);
            if (curArtist) {
                log(curDate + ': ' + curArtist + ' - ' + (album || ''));
            }
            const isTrackedArtist = artistsSet.has(normalize(artist || ''));
            curArtist = isTrackedArtist ? artist : '';
        }
    });
};

main();
