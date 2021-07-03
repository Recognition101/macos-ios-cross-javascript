///<reference path="../types/wishlist.d.ts" />
const iTunesApi = 'https://itunes.apple.com/lookup?id=';
const iTunesLink = 'https://itunes.apple.com/us/app/id';

/**
 * @typedef {Element|string|null} Child a DOM child to append to a new element
 */

/**
 *
 * @param {string} tag
 * @param {{[name: string]: string|undefined}} attrs
 * @param {Child[]|Child} children
 * @return {Element}
 */
const h = (tag, attrs, children=[]) => {
    const tagData = Array.from(tag.match(/(^|[#.])[^#.]*/g) || []);
    const el = document.createElement(tagData.shift() || 'div');
    tagData.forEach(str =>
        str[0] === '.' ? el.classList.add(str.substr(1)) :
        str[0] === '#' ? el.setAttribute('id', str.substr(1)) : '');

    Object.entries(attrs).forEach(([k, v]) => v ? el.setAttribute(k, v) : null);

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

/**
 *
 * @param {Wishlist.AppMap} wishlist
 * @return {Element}
 */
const makeIcons = (wishlist) => {
    return h('ul.icons', {}, Object.keys(wishlist).map(id => {
        const item = wishlist[id];
        const hasSale = item.salePrice !== undefined;
        return h('li', {}, [
            h('a', { href: iTunesLink + id, target: '_blank' }, [
                h('img', { src: item.artUrl, 'data-id': id }),
                h('h3', {}, item.name),
                h(`span.price${hasSale ? '.sale' : ''}`, {}, '$' + item.price),
                h('span.price', {}, hasSale ? '$' + item.salePrice : '')
            ])
        ]);
    }));
};

const main = async () => {
    /** @type {Wishlist.AppMap} */
    const wishlist = await loadData('./wishlist.json');

    /** @type {Wishlist.AppMap} */
    const saleList = await loadData('./wishlist-sale.json');

    document.body.innerHTML = '';
    document.body.appendChild(h('div.main', {}, [
        h('h1', {}, 'Wishlist'),
        h('h2', {}, 'Sale Items'),
        h('div#group-sale', {}, [ makeIcons(saleList) ]),
        h('h2', {}, 'All Items'),
        h('div#group-all', {}, [ makeIcons(wishlist) ])
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
