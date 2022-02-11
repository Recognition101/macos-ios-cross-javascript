// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: yellow; icon-glyph: compact-disc;

///<reference path="./types/LastFm.d.ts" />
// @ts-ignore
// eslint-disable-next-line
try { require; } catch(e) { require = () => importModule('lib/scriptable'); }

const {
    getInput, downloadText, readJson, log, external
} = require('./lib/node.js');

/**
 * @typedef {import("./lib/external/external.cjs").parse5.Document} Document
 * @typedef {import("./lib/external/external.cjs").parse5.ChildNode} ChildNode
 * @typedef {import("./lib/external/external.cjs").parse5.Element} Element
 */

const cosUrl = 'https://consequence.net/upcoming-releases/';

/**
 * Given a Parse5 node, select an element whose attributes match test functions.
 * @typedef {(value: string|undefined) => boolean} Predicate
 * @param {Document|ChildNode|null} el the node to get the content from
 * @param {ObjectMap<Predicate|string>} constraints select all nodes that
 *      return `true` for each of these attributes.
 * @param {Element[]} [matched] the elements that matched the constraints
 * @return {Element[]} the elements that matched the constraints
 */
const select = (el, constraints, matched = [ ]) => {
    if (el && 'attrs' in el) {
        const isMatch = Object.entries(constraints).every(([name, test]) => {
            const attribute = el.attrs.find(x => x.name === name);
            const value = name === 'tagName' ? el.tagName : attribute?.value;
            return typeof test === 'string' ? test === value : test(value);
        });
        if (isMatch) {
            matched.push(el);
        }
    }

    if (el && 'childNodes' in el) {
        const children = el.childNodes ?? [];
        for(const child of children) {
            select(child, constraints, matched);
        }
    }

    return matched;
};

/**
 * Given a Parse5 node, gets the text content viewable by a user.
 * @param {Document|ChildNode|null|undefined} el the node to compile the text of
 * @return {string} the text content
 */
const getTextContent = el => {
    const isComment = el && (el.nodeName === '#comment' || 'data' in el);
    const isText = el && 'value' in el;
    const isLine = el && el.nodeName === 'br';
    if (isText || isLine || isComment || !el) {
        return isText ? el.value : (isLine ? '\n' : '');
    }

    let childText = '';
    const children = el.childNodes ?? [];
    for(const child of children) {
        childText += getTextContent(child);
    }
    return childText;
};

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

    const artistJsonRaw = await readJson(pathArtists);
    const artistJson = /** @type {LastFm.JsonArtists|null} */(artistJsonRaw);
    const artists = artistJson?.artists ?? [ ];
    const artistsSet = new Set(artists.map(artist => normalize(artist)));

    const html = await downloadText(cosUrl);
    const doc = external.parse5.parse(html);
    const isContent = /(^|\s)post-content($|\s)/;
    const content = select(doc, { 'class': x => isContent.test(x ?? '') })[0];

    let dateText = 'RECENT: ';

    for(const child of content?.childNodes ?? [ ]) {
        const strong = select(child, { tagName: 'strong' })[0];
        const em = select(child, { tagName: 'em' })[0];
        const subChildren = 'childNodes' in child ? child.childNodes : [ ];

        // Match Date Node
        if (strong && !em && subChildren.length < 2) {
            dateText = getTextContent(strong);

        // Match Artist/Album Node
        } else if (strong) {
            const artist = getTextContent(strong);
            const album = getTextContent(em);
            if (artistsSet.has(normalize(artist))) {
                log(`${dateText} ${artist} - ${album}`);
            }
        }
    }
};

main();
