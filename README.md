# macOS/iOS Cross-Platform JavaScript

This repository contains a library that enables a single JavaScript file to run:

 1. In CLI on macOS
 2. From the share sheet on iOS/iPadOS (Using [Shortcuts](https://apps.apple.com/app/shortcuts/id915249334))
 3. From the home screen on iOS/iPadOS (Using [Shortcuts](https://apps.apple.com/app/shortcuts/id915249334))
 4. In the [Scriptable App](https://scriptable.app) on iOS/iPadOS

This repository also includes a set of automation scripts written using this library.

For example, the included `Sum.js` file allows a user to:

 1. In CLI on macOS, run `sum.js -n "1 2 3"` to output: `6`
 2. In iOS, select `1 2 3` (ex: in Notes) &rarr; <kbd>Share</kbd> &rarr; <kbd>Sum</kbd>, and a notification of `6` will pop up.
 3. In the iOS home screen, tap `Sum`, fill a "Numbers" prompt, and be notified with the sum.
 4. In the iOS Scriptable app, tap `Sum.js` to run the script just like on the home screen.

All four use cases are running the same JS file, synchronized over iCloud. Importantly, none of the use cases force the user to switch apps - they all run in whatever app/screen the user is currently on. While `Sum.js` is a simple example, arbitrarily complex scripts can be written that:

 1. Request complex input (date/times, choosing from a set, files/folders, etc.)
 2. Download/Upload Data
 3. Reading/writing to the filesystem (text or binary)
 4. Displaying notifications, text logs, rich HTML, or rendered Markdown

## Creating New Scripts (Environment Setup)

The [lib README](./lib/) describes how to setup and use the library to create new scripts that run on all platforms.

## Built-in Scripts

The following scripts are included in this repository.

Once set up, run each script with `-h` or `--help` for documentation. Help messages may refer to paths starting with `$`, which means "the script directory". For example, `$/README.md` refers to this file, and `$/lib/README.md` refers to the lib README.

### Scripts

 * App Icons
 * App Lists Import
 * App Lists Item
 * App Lists Manage
 * App Lists Update
 * App Lists
 * Cafe
 * Calc
 * Caller
 * Folder Union
 * Hue Cycle
 * LastFM History
 * Laundry Delay
 * LifeLog Log
 * LifeLog New
 * LifeLog Steam
 * LifeLog Stop
 * LifeLog Update Metadata
 * Lifelog Markdown
 * Markdown Folder
 * Music Playlists
 * Music Releases
 * Music Similar Artists
 * Music Top Tracks
 * Pass New Random
 * Pass New Words
 * Retroarch Doom Config
 * Retroarch Download Images
 * Retroarch Download Pico8
 * Retroarch Download Tree
 * Retroarch Make Playlist
 * Retroarch Set Config
 * Retroarch Steam Config
 * Retroarch Steam Grid
 * Retroarch Upload Tree
 * Scriptable Build
 * ScriptableHelperCopy
 * Shuttle Update
 * Shuttle
 * SteamCloud
 * SteamData Update
 * SteamData
 * TV Randomizer
 * TV Renamer
 * Temperature Log

### Share

 * Bsp Patcher
 * Game Add
 * LifeLog Url Finish
 * LifeLog Url Time
 * LifeLog Url
 * Markdown Compile
 * Markdown File
 * Open Key in Steam
 * Open from FB
 * Open in Archive
 * Open in Lyft
 * Open in Narwhal
 * Open in Safari
 * Sum
 * TimeStamp Decode
 * TimeStamp Get
 * Turnip Add
 * Word Count
 * Word Suggest
 * Word Unformat
 * Word Unprefix

