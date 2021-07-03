// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: gray; icon-glyph: cogs;
// @ts-nocheck
/* eslint no-undef: 0 */
const copyNotification = async () => {
    const notifications = await Notification.allDelivered();
    const text = notifications[0].subtitle;
    const colonIndex = text.indexOf(':');

    if (colonIndex >= 0) {
        Pasteboard.copy(text.substring(colonIndex + 2));
    }
    Script.setShortcutOutput('Output Copied.');
    Script.complete();
};

Pasteboard.copy(args.queryParameters['text']);
Script.complete();
