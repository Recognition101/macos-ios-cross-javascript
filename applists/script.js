///<reference path="../types/appLists.d.ts" />
///<reference path="../types/lib.d.ts" />
///<reference path="./applistsHtml.d.ts" />
const iTunesApi = 'https://itunes.apple.com/lookup?id=';
const iTunesLink = 'https://itunes.apple.com/us/app/id';

/**
 * Parses an ID number from a URL or title string.
 * @param {string} name the URL or title string to parse the ID from
 * @return {string} the ID or empty string if none found
 */
const parseId = name => name.match(/(?:^|id)(\d+)/)?.[1] ?? '';

/** @type {ObjectMap<string>} */
const attributeMap = {
    'htmlFor': 'for',
    'ariaLabel': 'aria-label',
    'ariaHidden': 'aria-hidden',
    'ariaChecked': 'aria-checked'
};

/**
 * Creates and populates an HTML element.
 * @template {keyof HTMLElementTagNameMap} T the created element uses this tag
 * @param {T} tag creates an HTML element with this tag name
 * @param {HtmlAttributeSet<T>} [attrs] attribute key/value pairs
 * @param {HtmlChildrenSet} [childSet] appends this/these to the result
 * @return {HTMLElementTagNameMap[T]} the resulting HTML DOM element
 */
const h = (tag, attrs, childSet = []) => {
    const el = document.createElement(tag);
    for (const name in attrs) {
        const value = /** @type {any} */(attrs)[name];

        if (name.startsWith('on') && value) {
            el.addEventListener(name.slice(2), value);

        } else if (name === 'style' && attrs.style) {
            Object.assign(el.style, attrs.style);

        } else if (name === 'classList' && attrs.classList) {
            for (const className of attrs.classList) {
                if (className) {
                    el.classList.add(className);
                }
            }
        } else if (name === 'dataset' && attrs.dataset) {
            for (const key in attrs.dataset) {
                el.setAttribute('data-' + key, attrs.dataset[key]);
            }
        } else if (name === 'className' && value) {
            el.className = String(value);

        } else if (name in attributeMap && value) {
            el.setAttribute(attributeMap[name], String(value));

        } else if (name && (value || value === '' || value === 0)) {
            el.setAttribute(name, String(value));
        }
    }
    const children = childSet instanceof Array ? childSet : [ childSet ];
    const nodes = children.map(child =>
        typeof child === 'string' ? document.createTextNode(child) : child);
    nodes.forEach(node => node ? el.appendChild(node) : null);

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
 * Creates the HTML representing an App Icon.
 * @param {AppListsMetadata} app the app metadata this DOM will represent
 * @return {HTMLLIElement} the newly created DOM
 */
const makeIcon = (app) => {
    const hasSale = app.salePrice !== undefined;
    const lastUpdate = (new Date(app.lastUpdated ?? 0)).toLocaleDateString();

    return h('li', { className: `app ${hasSale ? 'sale' : ''}` }, [
        h('a', { href: iTunesLink + app.id, target: '_blank' }, [
            h('img', { src: app.artUrl ?? '#', dataset: { id: app.id } }),
            h('h3', {}, app.name),
            h('div', { className: 'prices' }, [
                h('span', { className: 'price' }, `$${app.price}`),
                h('span', { className: 'price' }, `$${app.salePrice ?? ''}`)
            ]),
            h('div', { className: 'date' }, [ lastUpdate ])
        ])
    ]);
};

/**
 * Gets the app-last-updated date/time (in ms since the epoch).
 * @param {AppListsMetadata} app the app to get the last update time for
 * @return {number} the date/time (in milliseconds since the epoch)
 */
const getLastUpdated = app => new Date(app.lastUpdated ?? 0).getTime();

/**
 * Gets the app price (taking sales into account).
 * @param {AppListsMetadata} app the app to get the price of
 * @return {number} the price (in dollars)
 */
const getPrice = app => app.salePrice ?? app.price;

const main = async () => {
    /** @type {AppLists} */
    const listSet = await loadData('./lists.json');

    const domInputLists = h('select', { }, Object.keys(listSet.lists)
        .map(name => h('option', { value: name }, [ name ]))
    );

    const domInputSort = h('select', { }, [
        h('option', { value: 'manual' }, [ 'Manual (JSON Order)' ]),
        h('option', { value: 'date' }, [ 'Date Last Updated' ]),
        h('option', { value: 'price' }, [ 'Price' ])
    ]);

    const domInputGroup = h('select', { }, [
        h('option', { value: 'none' }, [ 'None' ]),
        h('option', { value: 'sale' }, [ 'Sale' ]),
        h('option', { value: 'completed' }, [ 'Completed' ])
    ]);

    const update = () => {
        /** @type {AppListsMetadataAbandoned[]} */
        const appsAbandoned =  [ ];
        /** @type {AppListsMetadata[]} */
        const appsAll =  [ ];

        for(const name of listSet.lists[domInputLists.value]) {
            const data = listSet.metadata[parseId(name)];
            if (data && !data.isDelisted) {
                appsAll.push(data);
            } else {
                const colon = name.indexOf(':');
                appsAbandoned.push({
                    id: colon >= 0 ? name.slice(0, colon) : '',
                    name: name.slice(colon + 1)
                });
            }
        }

        // Sort Apps
        if (domInputSort.value === 'date') {
            appsAll.sort((a, b) => getLastUpdated(b) - getLastUpdated(a));
        } else if (domInputSort.value === 'price') {
            appsAll.sort((a, b) => getPrice(b) - getPrice(a));
        }

        // Group Apps
        /** @type {HTMLElement[]} */
        const domGroups = [ ];

        if (domInputGroup.value === 'sale') {
            const appsSale = appsAll.filter(x => 'salePrice' in x);
            const appsMain = appsAll.filter(x => !('salePrice' in x));
            const iconsSale = appsSale.map(x => makeIcon(x));
            const iconsMain = appsMain.map(x => makeIcon(x));
            domGroups.push(h('h2', { },  [ 'Apps On Sale' ]));
            domGroups.push(h('ul', { className: 'icons' }, iconsSale));
            domGroups.push(h('h2', { },  [ 'Apps Not On Sale' ]));
            domGroups.push(h('ul', { className: 'icons' }, iconsMain));
        }

        if (domInputGroup.value === 'completed') {
            const appsMain = appsAll.filter(x => !x.completed);
            const appsDone = appsAll.filter(x => x.completed);
            const iconsMain = appsMain.map(x => makeIcon(x));
            const iconsDone = appsDone.map(x =>  makeIcon(x));
            domGroups.push(h('h2', { },  [ 'Unfinished Apps' ]));
            domGroups.push(h('ul', { className: 'icons' }, iconsMain));
            domGroups.push(h('h2', { },  [ 'Completed Apps' ]));
            domGroups.push(h('ul', { className: 'icons' }, iconsDone));
        }

        if (domInputGroup.value === 'none')  {
            const iconsAll = appsAll.map(x => makeIcon(x));
            domGroups.push(h('h2', { },  [ 'All Apps' ]));
            domGroups.push(h('ul', { className: 'icons' }, iconsAll));
        }

        const domAbandoned = [
            h('h2', { }, [ 'Abandoned Apps' ]),
            h('ul', { className: 'abandoned' },
                appsAbandoned.map(({ name, id }) => h('li', { }, [
                    id ? h('span', { className: 'id' }, [ id ]) : null,
                    h('span', { className: 'name' }, [ name ])
                ]))
            )
        ];

        // Create DOM
        domMain.innerHTML = '';
        domMain.appendChild(h('div', { }, [
            ...domGroups,
            ...(appsAbandoned.length > 0 ? domAbandoned : [ ])
        ]));
    };

    const domMain = h('div', { className: 'main' });
    domInputLists.addEventListener('change', update);
    domInputSort.addEventListener('change', update);
    domInputGroup.addEventListener('change', update);
    update();

    document.body.innerHTML = '';
    document.body.appendChild(h('h1', {}, 'App List'));
    document.body.appendChild(domInputLists);
    document.body.appendChild(domInputSort);
    document.body.appendChild(domInputGroup);
    document.body.appendChild(domMain);
};

main();
