// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: purple; icon-glyph: tv;

///<reference path="./types/tv.d.ts" />
// @ts-ignore
// eslint-disable-next-line
try { require; } catch(e) { require = () => importModule('lib/scriptable'); }

const { getInput, string, readJson, output, error } = require('./lib/node.js');

/**
 * Gets the season and episode number of a show at a given index.
 * If an index is not given, a random index will be used.
 * @param {number[]} seasons the list of episode counts per season
 * @param {number|null} [index] the (optional) index to get
 * @return {{season: number; episode: number}} the season/episode numbers
 */
const getShow = (seasons, index=null) => {
    const total = seasons.reduce((sum, x) => sum + x, 0);

    index = index !== null && index !== undefined
        ? Math.max(0, Math.min(total - 1, Math.round(index)))
        : Math.floor(total * Math.random());

    for(const [ season, episodeCount ] of seasons.entries()) {
        if (index < episodeCount) {
            return { season: season + 1, episode: index + 1 };
        }
        index = index - episodeCount;
    }

    return { season: 0, episode: 0 };
};

const pathConfig = '$/tv/shows.json';

const help = `Gets a random episode from a show chosen from the TV Config JSON.

Setup: Manually create the TV Config JSON.

TV Config JSON Path: ${pathConfig}
TV Config JSON Type: $/types/tv.d.ts::Tv.ShowConfig`;

const main = async () => {
    const configJson = await readJson(pathConfig);
    const config = /** @type {Tv.ShowConfig|null} */(configJson);
    const shows = config?.shows ?? [ ];
    const input = await getInput({
        help,
        inScriptable: false,
        args: [{
            name: 'show',
            shortName: 's',
            help: 'The name of the show to get.',
            type: 'enum',
            choices: (config?.shows ?? [ ])
                .map(x => ({ title: x.name, code: x.code }))
        }]
    });

    if (!input) { return; }

    const showCode = string(input.show);
    const show = shows.find(x => x.code === showCode);

    if (shows.length === 0 || !showCode || !show) {
        const reason = shows.length === 0
            ? 'No shows found in TV Config JSON.'
            : `Show (${showCode}) not found.`;
        return error('TV Randomizer', reason);
    }

    const { season, episode } = getShow(show.seasons);
    output(
        'Show Randomizer',
        `${show.name}: Season ${season}, Episode ${episode}`
    );
};

main();
