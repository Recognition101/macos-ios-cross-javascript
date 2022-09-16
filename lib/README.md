# Setup

This document describes how to use the library contained in this `lib` directory to create scripts that run:

1. In CLI on macOS
 2. From the share sheet on iOS/iPadOS (Using [Shortcuts](https://apps.apple.com/app/shortcuts/id915249334))
 3. From the home screen on iOS/iPadOS (Using [Shortcuts](https://apps.apple.com/app/shortcuts/id915249334))
 4. In the [Scriptable App](https://scriptable.app) on iOS/iPadOS

## Writing Scripts

In order for scripts to be able to run in all environments, they cannot use:

 * `require(...)` (importing NodeJS modules)
 * `import ...` (ES6-style imports)
 * `importModule(...)` (Scriptable-style import)

Instead, use these four lines to import the correct set of library functions depending on environment:

```js
// @ts-ignore
// eslint-disable-next-line
try { require; } catch(e) { require = importModule; }
const lib = require('./lib/lib.js');
```

The `lib` variable will then contain the library, with functions to:
 1. Request complex input (date/times, choosing from a set, files/folders, etc.)
 2. Download/Upload Data
 3. Reading/writing to the filesystem (text or binary)
 4. Displaying notifications, text logs, rich HTML, or rendered Markdown

For a full list of functions and constants in the bridge library, see the [API documentation](./api.md).

## Environment Setup: Scriptable and CLI

 1. Download [Scriptable](https://scriptable.app) on an iOS/iPadOS Device
 2. On a Mac: Copy this `lib` directory into the `Scriptable` iCloud directory
 3. On a Mac: Put this code in `~/.zshrc`:

```sh
export PATH_SCRIPTABLE=~/Library/Mobile\ Documents/iCloud~dk~simonbs~Scriptable/Documents
for file in $PATH_SCRIPTABLE/*.js; do
    alias $(basename $file | tr '[A-Z]' '[a-z]' | tr ' ' '-')="node \"$file\""
done
```

Once done, all scripts will be aliased for use in the CLI in lower-kebab-case. For instance, if a script is called `Test File Name.js`, a user could run: `test-file-name.js --help`.

Also, at this point, all scripts can be run in the Scriptable app on iOS.

## Environment Setup: Shortcuts (Share Sheets and Home Screens)

For each script whose `getInput(...)` call specifies `share: true`, create a shortcut. That shortcut should accept strings and urls, so that it displays on the share sheet. It should have the following steps:

 1. Dictionary (script &rarr; ScriptName<sup>[1]</sup>, share &rarr; `$SHORTCUT-INPUT`)
 2. Run shortcut (Scriptable Harness<sup>[2]</sup>) More(Input: `$PREVIOUS`<sup>[3]</sup>)

For each script that does not need to show up on a share sheet, create a shortcut. That shortcut should accept no input, and it should have the following steps:

 1. Dictionary (script &rarr; ScriptName<sup>[1]</sup>, share &rarr; "")
 2. Run shortcut (Scriptable Harness<sup>[2]</sup>) More(Input: `$PREVIOUS`<sup>[3]</sup>)

That shortcut can be added to the home screen.

*Notes:*
 1. "ScriptName" is the script to run. For example: `Test File Name` to run: `Test File Name.js`.
 2. This requires having created the "Scriptable Harness" shortcut described in the "Helper Shortcuts" section below.
 3. `$PREVIOUS` always refers to the result of the previous item in the same scope, including "Repeat Results" when referenced right outside/after a "Repeat".

## Helper Shortcuts

### Scriptable Harness

1. Set variable (inputDictionary) to (`$SHORTCUT-INPUT`)
2. Get (Value) for (script) in (`$inputDictionary`)
3. Set variable (script) to (`$PREVIOUS`)
4. Get (Value) for (share) in (`$inputDictionary`)
5. Set variable (share-raw) to (`$PREVIOUS`)
6. Text: "`$share-raw`"
7. Set variable (share-input) to (`$PREVIOUS`)
8. Dictionary ()
9. Set variable (output) to (`$PREVIOUS`)
10. Get file from (iCloud &rarr; Scriptable &rarr; args) at (`$script`.json) More(Error: (Off)) &rarr; `$MAGIC-FILE-ARGS`
11. If (`$MAGIC-FILE-ARGS`) (has any value)
    1. Set variable (argJsonString) to (`$MAGIC-FILE-ARGS`)
12. Otherwise
    1. [Scriptable] Run script (`$script`) More(Texts: [ "NONE", "shortcuts.getArgs" ], InApp: (Off), Show: (Off))
    2. Set variable (argJsonString) to (`$PREVIOUS`)
13. Get dictionary from (`$argJsonString`) &rarr; `$MAGIC-DICTIONARY-ARGS`
14. Get (Value) for (inScriptable) in (`$MAGIC-DICTIONARY-ARGS`)
15. Text: "`$PREVIOUS`"
16. Set variable (inScriptable) to `$PREVIOUS`
17. Get (Value) for (args) in (`$MAGIC-DICTIONARY-ARGS`)
18. Repeat with each item in (`$PREVIOUS`)
    1. *// Parse Argument Properties*
    2. Get (Value) for (name) in (`$REPEAT-ITEM`)
    3. Text: "`$PREVIOUS`"
    4. Set variable (name) to (`$PREVIOUS`)
    5. Get (Value) for (type) in (`$REPEAT-ITEM`)
    6. Text: "`$PREVIOUS`"
    7. Set variable (type) to (`$PREVIOUS`)
    8. Get (Value) for (help) in (`$REPEAT-ITEM`)
    9. Text: "`$PREVIOUS`"
    10. Set variable (help) to (`$PREVIOUS`)
    11. Get (Value) for (bookmarkName) in (`$REPEAT-ITEM`)
    12. Text: "`$PREVIOUS`"
    13. Set variable (bookmarkName) to (`$PREVIOUS`)
    14. Get (Value) for (share) in (`$REPEAT-ITEM`)
    15. Text: "`$PREVIOUS`"
    16. Set variable (share) to (`$PREVIOUS`)
    17. *// Argument is SHARE*
    18. If (`$share`) (is) (Yes)
        1. If (`$share-input`) (has any value)
            1. Set (`$name`) to (`$share-input`) in (`$output`)
            2. Set variable (`$output`) to (`$PREVIOUS`)
            3. Text: "share"
            4. Set variable (type) to (`$PREVIOUS`)
    19. *// Argument is PATHFILE*
    20. If (`$type`) (is) (pathFile)
        1. Show alert (`$help`) More(Title: (`$name`), Show Cancel Button: (Off))
        2. Get File, Service: (iCloud Drive), Show Document Picker: (On), Select Multiple: (Off)
        3. Create bookmark named (`$bookmarkName`) for (`$PREVIOUS`)
        4. Set (`$name`) to (`$bookmarkName`) in (`$output`)
        5. Set variable (output) to (`$PREVIOUS`)
    21. *// Argument is ENUM*
    22. If (`$type`) (is) (enum)
        1. Dictionary ()
        2. Set variable (enumMap) to (`$PREVIOUS`)
        3. Get (Value) for (choices) in (`$REPEAT-ITEM`)
        4. Repeat with each item in (`$PREVIOUS`)
            1. Get (Value) for (title) in (`$REPEAT-ITEM-2`) &rarr; `$MAGIC-ENUM-TITLE`
            2. Get (Value) for (code) in (`$REPEAT-ITEM-2`) &rarr; `$MAGIC-ENUM-CODE`
            3. Set (`$MAGIC-ENUM-TITLE`) to (`$MAGIC-ENUM-CODE`) in (`$enumMap`)
            4. Set variable (enumMap) to (`$PREVIOUS`)
            5. Text: "`$MAGIC-ENUM-TITLE`"
        5. Choose from (`$PREVIOUS`) More(Prompt: (`$name`: `$help`))
        6. Get (Value) for (`$PREVIOUS`) in (`$enumMap`)
        7. Set (`$name`) to (`$PREVIOUS`) in (`$output`)
        8. Set variable (output) to (`$PREVIOUS`)
    23. *// Argument is STRING*
    24. If (`$type`) (is) (string)
        1. Ask for (Text) with (`$name`: `$help`)
        2. Set (`$name`) to (`$PREVIOUS`) in (`$output`)
        3. Set variable (output) to (`$PREVIOUS`)
    25. *// Argument is BOOLEAN*
    26. If (`$type`) (is) (boolean)
        1. Dictionary (True &rarr; True, False &rarr; False) &rarr; `$MAGIC-DICTIONARY-TRUTH`
        2. Choose from (`$PREVIOUS->KEYS`) More(Prompt: (`$name`: `$help`))
        3. Get (Value) for (`$PREVIOUS`) in (`$MAGIC-DICTIONARY-TRUTH`)
        4. Set (`$name`) to (`$PREVIOUS`) in (`$output`)
        5. Set variable (output) to (`$PREVIOUS`)
    27. *// Argument is DATE*
    28. If (`$type`) (is) (date)
        1. Ask for (Date and Time) with (`$name`: `$help`) More(Default: (Current Date))
        2. Format (`$PREVIOUS`) More(Date Format: (RFC 2822))
        3. Set (`$name`) to (`$PREVIOUS`) in (`$output`)
        4. Set variable (output) to (`$PREVIOUS`)
19. If (`$inScriptable`) (is) (Yes)
    1. [Scriptable] Run (`$script`) More(Texts: [ `$output`, "shortcuts.setArgs" ], InApp: (On), Show: (On))
20. Otherwise
    1. [Scriptable] Run (`$script`) More(Texts: [ `$output`, "shortcuts.setArgs" ], InApp: (Off), Show: (Off))

### Save to Files (Extension)

Accepts: Text

1. Text: "`$SHORTCUT-INPUT`"
2. Set name of (`$PREVIOUS`) to (Text) More(Don't Include File Extension: (On))
3. Save (`$PREVIOUS`) Service: (iCloud Drive) Ask Where to Save: (On)

