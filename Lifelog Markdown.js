// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-green; icon-glyph: play-circle;

///<reference path="./types/lifeLog.d.ts" />
// @ts-ignore
// eslint-disable-next-line
try { require; } catch(e) { require = importModule; }

const { getInput, output, writeText } = require('./lib/lib.js');
const {
    pathLog, pathActivities, pathMarkdown,
    getActivityTitle,
    readLog, readActivities
} = require('./lib/lifelog.js');

const help = `Creates a human-readable MarkDown document listing of the LifeLog.

Output Path: ${pathMarkdown}
LifeLog JSON Path: ${pathLog}
LifeLog JSON Type: $/types/lifeLog.d.ts::LifeLog
LifeLog Activities JSON Path: ${pathActivities}
LifeLog Activities JSON Type: $/types/lifeLog.d.ts::LifeLogActivities`;

const main = async () => {
    const log = await readLog();
    const acts = await readActivities();

    const input = await getInput({
        name: 'LifeLog Markdown',
        help,
        inScriptable: false,
        args: [ ]
    });

    if (!input) { return; }

    let markdown = '# Life Log\n\n';

    const idMapEntries = Object.entries(log.idMap);
    const idToKey = new Map(idMapEntries.map(([key, id]) => [id, key]));

    // Bin entries by Day
    /** @type {Map<number, LifeLogActivitySummary[]>} */
    const days = new Map();

    for (const timestamp in log.log) {
        const time = parseInt(timestamp, 10);
        const id = log.log[timestamp];
        const key = idToKey.get(id) ?? 'ERROR: Missing Activity Key';
        const title = getActivityTitle(key, acts);

        const dayKey = (new Date(time)).setHours(0, 0, 0, 0);
        const day = days.get(dayKey) ?? [ ];
        day.push({ time, key, title });
        days.set(dayKey, day);
    }

    const dayEntries = Array.from(days.entries());
    dayEntries.sort(([timeA], [timeB]) => timeB - timeA);

    /** @type {LifeLogActivitySummary[]} */
    const group = [ ];
    for(const [ timeBin, summaries ] of dayEntries) {
        if (summaries.length === 1) {
            group.push(summaries[0]);
        } else {
            if (group.length > 0) {
                const min = group.reduce(
                    (min, act) => Math.min(min, act.time),
                    Infinity
                );
                const max = group.reduce(
                    (max, act) => Math.max(max, act.time),
                    0
                );
                const start = new Date(min).toLocaleDateString();
                const end = new Date(max).toLocaleDateString();
                markdown += min === max
                    ? `## ${start}\n\n`
                    : `## ${end} - ${start}\n\n`;

                for(const act of group) {
                    const actDate = new Date(act.time);
                    markdown += `- ${act.title} ` +
                        `_(${actDate.toLocaleString()})_\n`;
                }
                markdown += '\n';

                group.length = 0;
            }

            const dateBin = new Date(timeBin);
            markdown += `## ${dateBin.toLocaleDateString()}\n\n`;
            for(let i=summaries.length - 1; i >= 0; i -= 1) {
                const act = summaries[i];
                const actDate = new Date(act.time);
                markdown += `- ${act.title} ` +
                        `_(${actDate.toLocaleString()})_\n`;

            }
            markdown += '\n';
        }
    }

    await writeText(pathMarkdown, markdown);
    output('LifeLog Markdown', `Summary generated in: ${pathMarkdown}`);
};

main();
