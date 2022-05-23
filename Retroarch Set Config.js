// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: light-brown; icon-glyph: gamepad;
// share-sheet-inputs: plain-text, url;
/// <reference path="./types/retroarch.d.ts" />
// @ts-ignore
// eslint-disable-next-line
try { require; } catch(e) { require = () => importModule('lib/scriptable'); }

const {
    getInput, string, output, readText, writeText
} = require('./lib/node.js');

/** @type {ObjectMap<string>} */
const configPatchMap = {
    // This sets "Menu Toggle" Hotkey to L3 + R3.
    input_menu_toggle_gamepad_combo: '2',

    // This makes A -> OK, B -> Cancel
    menu_swap_ok_cancel_buttons: 'true',

    // This sets the menu time format to `MM-DD HH:MM AMPM`
    menu_timedate_style: '20',

    // XMB UI
    menu_driver: 'xmb',
    xmb_vertical_thumbnails: 'true',

    // Thumbnail Configuration (0 = none, 1 = snaps, 2 = titles, 3 = boxarts)
    menu_thumbnails: '3',
    menu_left_thumbnails: '2',

    // Disable Most Settings
    kiosk_mode_enable: 'false',

    // Hide Unused Menus
    content_show_add: 'false',
    content_show_explore: 'false',
    content_show_favorites: 'false',
    content_show_history: 'true',
    content_show_images: 'false',
    content_show_video: 'false',
    content_show_music: 'false',
    content_show_netplay: 'false',
    content_show_playlists: 'true',
    content_show_settings: 'false',
    content_show_add_entry: 'false',
    content_show_contentless_cores: 'false'
};


const main = async () => {
    const input = await getInput({
        help: 'Updates a retroarch.cfg with preferred custom config.',
        inScriptable: false,
        args: [{
            name: 'file',
            shortName: 'f',
            type: 'pathFile',
            bookmarkName: 'retroarch-set-config-file',
            help: 'The config file to patch.'
        }]
    });
    if (!input) { return; }

    const configPath = string(input.file);
    let config = (await readText(configPath)) || '';
    const configPatches = Object.entries(configPatchMap);

    for(const [key, value] of configPatches) {
        const replacer = new RegExp(`^${key}\\s*=.*$`, 'mg');
        config = config.replace(replacer, `${key} = "${value}"`);
    }

    await writeText(configPath, config);

    output('Retroarch Set Config', `Updated ${configPatches.length} keys.`);
};

main();
