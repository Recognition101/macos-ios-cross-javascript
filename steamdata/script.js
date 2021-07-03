/// <reference path="../types/steam.d.ts" />

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

/**
 * Given a time (in minutes), convert it to a string.
 * @param {number} time the time (in minutes)
 * @return {string} the string describing this time amount
 */
const getDuration = time => time > 60
    ? (Math.round(time / 60 * 10) / 10).toString() + ' hrs'
    : time + ' mins';

const main = async () => {
    /** @type {SteamData.UserData} */
    const userData = await loadData('./userdata.json');

    const achievements = userData.games
        .flatMap(({ game, achievements }) =>
            achievements.map(achievement => ({ game, achievement })))
        .filter(x => x.achievement.achieved === 1)
        .sort((a, b) => b.achievement.unlocktime - a.achievement.unlocktime);

    /** @type {SteamData.PlayedGame[]} */
    const groups = [ ];
    for(const { achievement, game } of achievements) {
        const group = groups.length > 0 ? groups[groups.length - 1] : null;
        if (!group || group.game !== game) {
            groups.push({ game, achievements: [ achievement ] });
        } else {
            group.achievements.push(achievement);
        }
    }

    document.body.innerHTML = '';
    document.body.appendChild(h('div.main', {}, [
        h('h1', {}, 'Steam Achievement List'),
        h('ul', {}, groups.map(({ game, achievements }) => {

            const timeAll = getDuration(game.playtime_forever);
            //const timeMac = getDuration(game.playtime_mac_forever);
            //const timeLin = getDuration(game.playtime_linux_forever);
            //const timeWin = getDuration(game.playtime_windows_forever);
            //const time = `${timeAll} (${timeWin} / ${timeMac} / ${timeLin})`;

            return h('li', {}, [
                h('h2.title', {}, [ `${game.name} (${timeAll})` ]),
                h('ul.achievements', {}, achievements.map(achievement => {
                    const { name, description, unlocktime } = achievement;
                    const unlockDate = new Date(unlocktime * 1000);
                    const unlockString = unlockDate.toLocaleString();
                    const extraInfo = description ? `(${description})` : '';
                    const text = `${unlockString} - ${name} ${extraInfo}`;
                    return h('li', {}, [ text ]);
                }))
            ]);
        }))
    ]));
};

main();
