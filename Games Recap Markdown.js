// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: yellow; icon-glyph: flag-checkered;

// @ts-ignore
// eslint-disable-next-line
try { require; } catch(e) { require = importModule; }

const {
    getInput, readJson, error, output, downloadJson, writeText
} = require('./lib/lib.js');

/**
 * @typedef {import('./types/games-recap').Config} Config
 * @typedef {import('./types/games-recap').Api} Api
 * @typedef {import('./types/games-recap').GameMetadata} GameMetadata
 */

const pathConfig = '$/games-recap/games-recap-config.json';
const pathOutput = '$/games-recap/checklist.md';

const help = `Creates a markdown checklist for a given GamesRecap.io year.

Setup: Manually create Games Recap Config JSON.

Games Recap Config JSON Path: ${pathConfig}
Games Recap Config JSON Type: $/types/games-recap.ts::Config
Games Recap Output Path: ${pathOutput}`;

const main = async () => {
    const input = await getInput({
        name: 'Games Recap Markdown',
        help,
        inScriptable: false,
        args: []
    });
    if (!input) { return; }

    const config = /** @type {Config|null} */(await readJson(pathConfig));
    if (!config) {
        return error('Games Recap Markdown', `Could not read: ${pathConfig}`);
    }

    const url = `https://${config.year}.gamesrecap.io/api/data`;
    const json = /** @type {Api|null} */(await downloadJson(url));
    if (!json) {
        return error('Games Recap Markdown', `Could Not Download: ${url}`);
    }

    /** @type {Map<string, GameMetadata>} */
    const gameMap = new Map();
    const ignoredConferences = new Set(config.ignoredConferenceTitles);
    /** @type {Set<string>} */
    const conferences = new Set();

    for(const game of json.games) {
        if (!ignoredConferences.has(game.conference.title)) {
            const gameInfo = gameMap.get(game.title) || {
                conferences: new Set(),
                media: new Set()
            };
            const conference = game.conference.title.trim();
            gameInfo.conferences.add(conference);
            conferences.add(conference);
            for(const media of game.media) {
                gameInfo.media.add(media.link.trim());
            }
            gameMap.set(game.title, gameInfo);
        }
        
    }

    let markdown = `# Games Recap ${config.year}\n\n`

    markdown += `## Conferences\n\n`;
    for(const conf of conferences) {
        markdown += `- ${conf}\n`;
    }
    markdown += `\n\n`;

    markdown += `## Games\n\n`;
    for(const title of Array.from(gameMap.keys()).sort()) {
        const gameInfo = gameMap.get(title);
        if (gameInfo) {
            markdown += `- [ ] **${title}**\n`;
            for(const conf of gameInfo.conferences) {
                markdown += `    - ${conf}\n`;
            }
            for(const media of gameInfo.media) {
                markdown += `    - [Video](${media})\n`;
            }
        }
    }

    await writeText(pathOutput, markdown);
    output('Games Recap Markdown', 'Markdown generated.');
};

main();
