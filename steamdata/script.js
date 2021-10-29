/// <reference path="../types/steam.d.ts" />
/// <reference path="../types/gamecenter.d.ts" />

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

/**
 * Given a UTC time (ms since epoch), convert it to a string.
 * @param {number|string} time the time (in ms since epoch) or UTC time-string
 * @return {string} the human readable time
 */
const getTime = time => (new Date(time)).toLocaleString();

const main = async () => {
    /** @type {SteamData.UserData|null} */
    const steam = await loadData('./userdata.json');
    /** @type {GameCenter.History|null} */
    const apple = await loadData('./userdata-GameCenter.json');

    const steamList = (steam?.games ?? [ ]).flatMap(({ game, achievements }) =>
        achievements
            .filter(x => x.achieved === 1)
            .map(achievement => ({
                game: {
                    name: game.name,
                    detail: `Playtime: ${getDuration(game.playtime_forever)}`
                },
                name: achievement.name,
                description: achievement.description,
                time: (new Date(achievement.unlocktime * 1000)).getTime()
            }))
    );

    const appleList = (apple?.games_state ?? [ ]).flatMap(game => {
        const leaders = game.leaderboard.flatMap(leader => {
            return leader.leaderboard_score.map(score => ({
                game: {
                    name: game.game_name,
                    detail: `Last Played: ${getTime(game.last_played_utc)}`
                },
                name: leader.leaderboard_title,
                description:
                    `${score.time_scope} Score: ${score.score} ` +
                    `(Rank ${score.rank})`,
                time: (new Date(score.submitted_time_utc)).getTime()
            }));
        });

        const achievements = game.achievements.map(achievement => ({
            game: {
                name: game.game_name,
                detail: `Last Played: ${getTime(game.last_played_utc)}`
            },
            name: achievement.achievements_title,
            description: `${achievement.percentage_complete}% Complete`,
            time: (new Date(achievement.last_update_utc)).getTime()
        }));

        return leaders.concat(achievements);
    });

    const allList = steamList.concat(appleList);

    allList.sort((a, b) => b.time - a.time);

    /**
     * @typedef {Object} AchievementGroup
     * @prop {typeof allList[number]["game"]} game the game key
     * @prop {typeof allList} achievements the list of achievements
     */

    /** @type {AchievementGroup[]} */
    const groups = [ ];
    for(const item of allList) {
        const group = groups.length > 0 ? groups[groups.length - 1] : null;
        if (!group || group.game.name !== item.game.name) {
            groups.push({ game: item.game, achievements: [ item ] });
        } else {
            group.achievements.push(item);
        }
    }

    document.body.innerHTML = '';
    document.body.appendChild(h('div.main', {}, [
        h('h1', {}, 'Steam Achievement List'),
        h('ul', {}, groups.map(({ game, achievements }) => {
            return h('li', {}, [
                h('h2.title', {}, [ `${game.name} (${game.detail})` ]),
                h('ul.achievements', {}, achievements.map(achievement => {
                    const { name, description, time } = achievement;
                    const extraInfo = description ? `(${description})` : '';
                    const text = `${getTime(time)} - ${name} ${extraInfo}`;
                    return h('li', {}, [ text ]);
                }))
            ]);
        }))
    ]));
};

main();
