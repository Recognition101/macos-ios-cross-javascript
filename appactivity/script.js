/// <reference path="../types/appActivity.d.ts" />
const iTunesApi = 'https://itunes.apple.com/lookup?id=';
const iTunesLink = 'https://itunes.apple.com/us/app/id';

/**
 *
 * @typedef {{[k in keyof CSSStyleDeclaration]?: string|null}} StyleBlock
 * @typedef {Element|string|null} Child a DOM child to append to a new element
 * @param {string} tag
 * @param {{[name: string]: StyleBlock|string|undefined|null}} attrs
 * @param {Child[]|Child} children
 * @return {Element}
 */
const h = (tag, attrs, children=[]) => {
    const tagData = Array.from(tag.match(/(^|[#.])[^#.]*/g) || []);
    const el = document.createElement(tagData.shift() || 'div');
    tagData.forEach(str =>
        str[0] === '.' ? el.classList.add(str.substr(1)) :
        str[0] === '#' ? el.setAttribute('id', str.substr(1)) : '');

    const style = attrs['style'];
    delete attrs['style'];
    if (style && typeof style === 'object') { Object.assign(el.style, style); }

    Object.entries(attrs)
        .forEach(([k, v]) => v ? el.setAttribute(k, String(v)) : null);

    const kids = children instanceof Array ? children : [ children ];
    const kidNodes = kids.map(
        kid => typeof kid === 'string' ? document.createTextNode(kid) : kid);
    kidNodes.forEach(node => node ? el.appendChild(node) : null);

    return el;
};

/**
 * Gets data, either from an inline JSON blob or from fetching a JSON file.
 * @param {string} name the JSON filename to fetch, ex: `"./wishlist.json"`.
 * @return {Promise<any>} a promise resolving to the JSON contents of the file
 */
const loadData = async (name) => {
    const inline = document.querySelector(`[data-name="${name}"]`);
    const inlineContent = inline && inline.innerHTML.trim();
    if (inlineContent) {
        return JSON.parse(inlineContent);
    } else {
        return await (await fetch(name)).json();
    }
};

const main = async () => {
    /** @type {AppActivities} */
    const activityMap = await loadData('./activity.json');
    const activityList = Object.values(activityMap);

    const live = activityList.filter(x => x.lastUpdated !== null);
    const dead = activityList.filter(x => x.lastUpdated === null);

    live.sort((a, b) =>
        (new Date(b.lastUpdated || 0)).getTime() -
        (new Date(a.lastUpdated || 0)).getTime() );

    document.body.innerHTML = '';
    document.body.appendChild(h('div.main', {}, [
        h('h1', {}, 'Activity List'),
        h('h2', {}, 'Live Apps'),
        h('ul.live.icons', {}, live.map(x => {
            const date = new Date(x.lastUpdated || 0);
            return h('li', {}, [
                h('a', { href: iTunesLink + x.id, 'data-id': x.id }, [
                    h('img', { src: x.artUrl }),
                    h('h3', {}, x.name),
                    h('div.date', {},
                        (date.getMonth() + 1) + ' / ' +
                        (date.getDate()) + ' / ' +
                        date.getFullYear()
                    )
                ])
            ]);
        })),
        h('h2', {}, 'Dead Apps'),
        h('ul.dead', {}, dead.map(x =>
            h('li', {}, x.name))
        )
    ]));

    //document.body.addEventListener('click', ev => {
    //    const target = /** @type {HTMLElement} */(ev.target);
    //    const idEl = target.closest('[data-id]');
    //    if (idEl) {
    //        const id = idEl.getAttribute('data-id');
    //        navigator.share({
    //            title: 'App Link',
    //            text: 'Sharing the iTunes App Link',
    //            url: iTunesLink + id
    //        });
    //    }
    //});
};

main();
