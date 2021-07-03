// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: purple; icon-glyph: phone;
///<reference path="./types/caller.d.ts" />
// @ts-ignore
// eslint-disable-next-line
try { require; } catch(e) { require = () => importModule('lib/scriptable'); }

const { getInput, readJson, open, output, error } = require('./lib/node.js');
const pathBook = '$/caller/contacts.json';
const help = `Call or SMS a favorite contact listed in the Contacts JSON.

Setup: Manually create the Contacts JSON file.

Contacts JSON Path: ${pathBook}
Contacts JSON Type: $/types/caller.d.ts::Caller.Book`;

const main = async () => {
    const book = /** @type {Caller.Book|null} */(await readJson(pathBook));
    const contacts = book?.contacts ?? [ ];
    const input = await getInput({
        help,
        inScriptable: true,
        args: [{
            name: 'person',
            shortName: 'p',
            help: 'The name of the person to contact.',
            type: 'enum',
            choices: contacts.map(x => ({ title: x.name, code: x.code }))
        }, {
            name: 'type',
            shortName: 't',
            help: 'The type of contact to make. By default, assumes phone.',
            type: 'enum',
            choices: [
                { title: 'Call', code: 'call' },
                { title: 'Message', code: 'sms' }
            ]
        }]
    });

    if (!input) { return; }

    const contact = contacts.find(x => x.code === input.person);

    if (!contact) {
        error('Caller', 'Could not find contact.');
        return;
    }

    const pre = input.type === 'sms' ? 'sms://' : 'tel:';
    open((pre + contact.phone).replace(/[^ -~]/g, ''));
    output(null, '');
};

main();

