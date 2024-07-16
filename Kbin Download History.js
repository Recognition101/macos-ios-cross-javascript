// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: light-brown; icon-glyph: download;
// share-sheet-inputs: file-url;
// @ts-ignore
// eslint-disable-next-line
try { require; } catch(e) { require = importModule; }

/**
 * @typedef {import("./types/kbin").KbinHistory} KbinHistory
 * @typedef {import("./types/kbin").KbinUpvote} KbinUpvote
 */

const {
    string,
    output,
    getInput,
    sendRequest,
    log,
    external,
    writeJson
} = require('./lib/lib.js');

const { select, getTextContent } = require('./lib/parse5.js');

const pathDownloadJson = '$/kbin-history.json';
const urlKbinUpvotes = 'https://kbin.social/fav';

const help = '' +
`Given a Kbin cookie, download all upvotes into a JSON file.

Kbin History JSON Path: ${pathDownloadJson}
Kbin History JSON Type: $/kbin-history.json/retroarch.d.ts::KbinHistory`;

/**
 * Downloads a tree at a particular path from a RetroArch server.
 */
const main = async () => {
    const input = await getInput({
        name: 'Kbin Download History',
        help,
        inScriptable: true,
        args: [{
            name: 'cookie',
            shortName: 'c',
            type: 'string',
            help: 'The cookie string of the user to download from.'
        }]
    });
    if (!input) { return; }

    const cookieRaw = string(input.cookie);
    const cookie = cookieRaw.startsWith('Cookie: ')
        ? cookieRaw.substring(8).trim()
        : cookieRaw.trim();

    const headers = {
        'Cookie': cookie,
        'Host': 'kbin.social',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Dest': 'document'
    };

    /** @type {KbinHistory} */
    const history = { upvotes: [] };

    let page = 1;
    let maxPage = 1;
    while(page <= maxPage) {
        log(`Downloading page ${page} / ${maxPage}`);
        const response = await sendRequest(
            urlKbinUpvotes + '?p=' + page,
            headers,
            undefined,
            'GET'
        );

        const html = external.parse5.parse(response);
        const entries = select(html, {
            'class': x => !!x?.split(' ').includes('entry')
        });
        for(const entry of entries) {
            // Get Original URL
            let originalUrl = '';
            const copies = select(entry, { 'data-action': 'clipboard#copy' });
            for(const copy of copies) {
                const text = getTextContent(copy).trim();
                if (text === 'copy original url') {
                    const href = copy.attrs.find(x => x.name === 'href');
                    originalUrl = href?.value ?? '';
                }
            }

            // Get Url, Name
            let url = '';
            let title = '';
            const h2 = select(entry, { 'tagName': 'h2' })[0];
            if (h2) {
                const anchor = h2.childNodes.find(x => x.nodeName === 'a');
                title = getTextContent(anchor).trim();
                if (anchor && 'attrs' in anchor) {
                    const href = anchor.attrs.find(x => x.name === 'href');
                    url = href?.value.trim() ?? '';
                }
            }

            // Get User, Time, Mag
            let user = '';
            let time = '';
            let community = '';
            const meta = select(entry, {
                'class': x => !!x?.split(' ').includes('meta')
            })[0];
            if (meta) {
                const userLink = select(meta, {
                    'data-mentions-username-param': x => !!x 
                })[0];
                user = userLink?.attrs
                    ?.find(x => x.name === 'data-mentions-username-param')
                    ?.value.trim() ?? '';

                const timeElement = select(meta, { 'tagName': 'time' })[0];
                time = timeElement?.attrs
                    ?.find(x => x.name === 'datetime')
                    ?.value.trim() ?? '';

                const magElement = select(meta, {
                    'class': x => !!x?.split(' ').includes('magazine-inline')
                })[0];
                community = magElement?.attrs
                    ?.find(x => x.name === 'href')
                    ?.value.trim() ?? '';
            }

            // Get Votes
            const votes = getTextContent(
                select(entry, { 'data-subject-target': 'favCounter' })[0]
            ).trim();

            /** @type {KbinUpvote} */
            const serialized = {
                originalUrl,
                url,
                title,
                user,
                time,
                community,
                votes
            };

            const missingProperty =
                !originalUrl ? 'originalUrl' :
                !url ? 'url' :
                !title ? 'title' :
                !user ? 'user' :
                !time ? 'time' :
                !community ? 'community' :
                !votes ? 'votes' : null;

            if (missingProperty) {
                const json = JSON.stringify(serialized, null, '    ');
                log(`Missing ${missingProperty} in ${json}`);
            }

            history.upvotes.push(serialized);
        }

        page += 1;

        const pagination = select(html, {
            'tagName': 'a',
            'class': x => !!x?.includes('pagination__item' )
        });
        for(const pageButton of pagination) {
            const pageNumber = parseInt(getTextContent(pageButton));
            if (!isNaN(pageNumber)) {
                maxPage = Math.max(maxPage, pageNumber);
            }
        }
    }

    await writeJson(pathDownloadJson, history);

    output('Kbin Download History', `Done`);
};

main();


