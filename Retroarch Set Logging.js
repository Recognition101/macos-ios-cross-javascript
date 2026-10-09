// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: light-brown; icon-glyph: gamepad;
// share-sheet-inputs: file-url;
// @ts-ignore
// eslint-disable-next-line
try { require; } catch(e) { require = importModule; }

const {
    getInput, string, output, readText, writeText
} = require('./lib/lib.js');

const help = `Updates a retroarch.cfg to enable or disable logging.
`;

const main = async () => {
    const input = await getInput({
        name: 'Retroarch Set Logging',
        help,
        inScriptable: false,
        args: [{
            name: 'config',
            shortName: 'c',
            type: 'pathFile',
            bookmarkName: 'retroarch-set-logging-file',
            help: 'The config file to patch.'
        }, {
            name: 'log',
            shortName: 'l',
            type: 'boolean',
            help: 'If given (true), enable logging.'
        }]
    });
    if (!input) { return; }

    const doLog = !!(input.log);
    const configPath = string(input.config);
    let config = (await readText(configPath)) || '';

    const configPatches = {
        frontend_log_level: '0', // 0 is maximum log level
        libretro_log_level: '0',
        log_dir: '~/Documents/RetroArch/logs',
        log_to_file: doLog ? 'true' : 'false',
        log_to_file_timestamp: 'true',
        log_verbosity: 'true'
    };

    for(const [key, value] of Object.entries(configPatches)) {
        const replacer = new RegExp(`^${key}\\s*=.*$`, 'mg');
        if (replacer.test(config)) {
            config = config.replace(replacer, `${key} = "${value}"`);
        } else {
            config += `\n${key} = "${value}"`;
        }
    }
    if (!config.endsWith('\n')) {
        config += '\n';
    }

    await writeText(configPath, config);

    const didLogStr = doLog ? 'enabled' : 'disabled';
    output('Retroarch Set Logging', `Logging has been ${didLogStr}.`);
};

main();
