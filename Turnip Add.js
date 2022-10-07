// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-green; icon-glyph: leaf;
// share-sheet-inputs: plain-text;

// @ts-ignore
// eslint-disable-next-line
try { require; } catch(e) { require = importModule; }

const {
    getInput, readJson, writeJson, error, output
} = require('./lib/lib.js');

const pathLog = '$/turnip/turnip-log.json';
const help = `Adds a turnip price to the log. Sets this key/value pair:
    Key: Current Time (UNIX Time)
    Value: Given Price to Add

Turnip JSON Path: ${pathLog}
Turnip JSON Type: ObjectMap<number>`;

const main = async () => {
    const input = await getInput({
        name: 'Turnip Add',
        help,
        inScriptable: false,
        args: [{
            name: 'price',
            shortName: 'p',
            type: 'string',
            share: true,
            help: 'The price to add (as a value) to the log.'
        }]
    });

    if (!input) { return; }
    if (!input.price) { return error('Turnip Add', 'No price added.'); }

    const logJson = await readJson(pathLog);
    const turnipLog = /** @type {ObjectMap<number>|null} */(logJson) || { };
    const price = Number(input.price) || 0;
    turnipLog[(new Date()).getTime()] = price;
    await writeJson(pathLog, turnipLog);
    output('Turnip Add', 'Turnip Price Added: ' + price);
};

main();
