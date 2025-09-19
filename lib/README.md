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

1. Dictionary (&darr;) &rarr; Run shortcut (Scriptable Harness<sup>[2]</sup>), Input: (<kbd>&rarrhk;</kbd>)<sup>[3]</sup>
    1. (script) (Text) &rarr; (ScriptName)<sup>[1]</sup>
    2. (share) (Text) &rarr; (`$SHORTCUT-INPUT`)

For each script that does not need to show up on a share sheet, create a shortcut. That shortcut should accept no input, and it should have the following steps:

1. Dictionary (&darr;) &rarr; Run shortcut (Scriptable Harness<sup>[2]</sup>), Input: (<kbd>&rarrhk;</kbd>)<sup>[3]</sup>
    1. (script) (Text) &rarr; (ScriptName)<sup>[1]</sup>
    2. (share) (Text) &rarr; ()

That shortcut can be added to the home screen.

*Notes:*
 1. "ScriptName" is the script to run. For example: `Test File Name` to run: `Test File Name.js`.
 2. This requires having created the "Scriptable Harness" shortcut described in the "Helper Shortcuts" section below.
 3. <kbd>&rarrhk;</kbd> always refers to the result of the previous item in the same scope, including "Repeat Results" when referenced right outside/after a "Repeat".



## Helper Shortcuts


### Scriptable Harness Run JS

#### Bash Script

```bash
export PATH="{{PATH}}"

node "/Path/To/This/Repository/{{NAME}}.js" --shortcuts-args "$1" --shortcuts-mode "{{MODE}}"
```

Notes:
1. The `{{PATH}}` text should be replaced by pasting after running `echo $PATH | pbcopy` in a terminal.
2. The `{{NAME}}` text should be replaced with the shortcuts `$name` variable block.
3. The `{{MODE}}` text should be replaced with the shortcuts `$mode` variable block.

#### Shortcuts Code

1. Set variable (input) to (`$SHORTCUT-INPUT`)
2. Get (Value) for (name) in (`$input`) &rarr; Set variable (name) to (<kbd>&rarrhk;</kbd>)
3. Get (Value) for (args) in (`$input`) &rarr; Set variable (args) to (<kbd>&rarrhk;</kbd>)
4. Get (Value) for (mode) in (`$input`) &rarr; Set variable (mode) to (<kbd>&rarrhk;</kbd>)
5. Get (Value) for (inScriptable) in (`$input`) &rarr; Set variable (inScriptable) to (<kbd>&rarrhk; as boolean</kbd>) 
6. If (OS) (is) (macOS)
    1. Run Shell Script (`BASH SCRIPT IN SECTION ABOVE`), Shell: (zsh), Input: (`$args`), Pass Input: (as arguments), Run as Administrator: (&#x2610;)
7. Otherwise
    1. Get file from (iCloud &rarr; Scriptable) at path (`$name`.js), Error if Not Found: (&#x2611;) &rarr; `$MAGIC-SCRIPTABLE-FILE`
    2. If `$inScriptable`
        1. [Scriptable] Run Inline Script (`$MAGIC-SCRIPTABLE-FILE as text`), Texts: [`$args`, `$mode`], Run In App: (&#x2611;), Show When Run: (&#x2611;)
    3. Otherwise
        1. [Scriptable] Run Inline Script (`$MAGIC-SCRIPTABLE-FILE as text`), Texts: [`$args`, `$mode`], Run In App: (&#x2610;), Show When Run: (&#x2610;)


### Scriptable Harness Get File

1. Select (Files), Select Multiple: (&#x2610;) &rarr; `$MAGIC-FILE`
2. If (OS) (is) (macOS)
    1. Stop and output (`$MAGIC-FILE as File Path`)
3. Otherwise
    1. [Scriptable] Create bookmark named (`$SHORTCUT-INPUT`) for (`$MAGIC-FILE`)
    2. Stop and output `$SHORTCUT-INPUT`


### Scriptable Harness

1. Set variable (inputDictionary) to (`$SHORTCUT-INPUT`)
2. Get (Value) for (script) in (`$inputDictionary`) &rarr; Set variable (script) to (<kbd>&rarrhk;</kbd>)
3. Get (Value) for (share) in (`$inputDictionary`) &rarr; Set variable (share-raw) to (<kbd>&rarrhk;</kbd>)
4. Text (`$share-raw`) &rarr; Set variable (share-input) to (<kbd>&rarrhk;</kbd>)
5. Dictionary () &rarr; Set variable (output) to (<kbd>&rarrhk;</kbd>)
6. Get file from (iCloud &rarr; Scriptable &rarr; args) at path (`$script`.json), Error If Not Found: (&#x2610;) &rarr; `$MAGIC-FILE-ARGS`
7. If (`$MAGIC-FILE-ARGS`) (has any value)
    1. Set variable (argJsonString) to `$MAGIC-FILE-ARGS`
8. Otherwise
    1. Dictionary (&darr;) &rarr; Run (Scriptable Harness Run JS), Input: (<kbd>&rarrhk;</kbd>) &rarr; Set variable (argJsonString) to (<kbd>&rarrhk;</kbd>)
        1. (name) (Text) &rarr; (`$script`)
        2. (args) (Text) &rarr; ({})
        3. (mode) (Text) &rarr; (shortcuts.getArgs)
        4. (inScriptable) (Boolean) &rarr; (False)
9. Get dictionary from (`$argJsonString`) &rarr; `$MAGIC-ARGS`
10. Get (Value) for (inScriptable) in (`$MAGIC-ARGS`) &rarr; Set variable (inScriptable) to (<kbd>&rarrhk;</kbd>)
11. Get (Value) for (outputType) in (`$MAGIC-ARGS`) &rarr; Text (<kbd>&rarrhk;</kbd>) &rarr; Set variable (outputType) to (<kbd>&rarrhk;</kbd>)
12. Get (Value) for (args) in (`$MAGIC-ARGS`)
13. &rarr; Repeat with each item in (<kbd>&rarrhk;</kbd>)
    1. *// Parse Argument Properties*
    2. Get (Value) for (name) in (`$REPEAT-ITEM`) &rarr; Text (<kbd>&rarrhk;</kbd>) &rarr; Set variable (name) to (<kbd>&rarrhk;</kbd>)
    3. Get (Value) for (type) in (`$REPEAT-ITEM`) &rarr; Text (<kbd>&rarrhk;</kbd>) &rarr; Set variable (type) to (<kbd>&rarrhk;</kbd>)
    4. Get (Value) for (help) in (`$REPEAT-ITEM`) &rarr; Text (<kbd>&rarrhk;</kbd>) &rarr; Set variable (help) to (<kbd>&rarrhk;</kbd>)
    5. Get (Value) for (bookmarkName) in (`$REPEAT-ITEM`) &rarr; Text (<kbd>&rarrhk;</kbd>) &rarr; Set variable (bookmarkName) to (<kbd>&rarrhk;</kbd>)
    6. Get (Value) for (share) in (`$REPEAT-ITEM`) &rarr; Text (<kbd>&rarrhk;</kbd>) &rarr; Set variable (share) to (<kbd>&rarrhk;</kbd>)
    7. *// Argument is SHARE*
    8. If (`$share`) (is) (Yes)
        1. Match (\^\\s+\$) in (`$share-input`) &rarr; `$MAGIC-MATCH`
        2. If (All) are true: (`$MAGIC-MATCH as text`) (does not have any value) *and* (`$share-input`) (is not) ()
            1. Set (`$name`) to (`$share-input`) in (`$output`) &rarr; Set variable (output) to (<kbd>&rarrhk;</kbd>)
            2. Text (share) &rarr; Set variable (type) to (<kbd>&rarrhk;</kbd>)
    9. *// Argument is PATHFILE*
    10. If (`$type`) is (pathFile)
        1. Show alert (`$help`), Title: (`$name`), Show Cancel Button: (&#x2610;)
        2. Run (Scriptable Harness Get File), Input: `$bookmarkName`
        3. &rarr; Set (`$name`) to (<kbd>&rarrhk;</kbd>) in `$output` &rarr; Set variable (output) to (<kbd>&rarrhk;</kbd>)
    11. *// Argument is ENUM*
    12. If (`$type`) is (enum)
        1. Dictionary () &rarr; Set variable (enumMap) to (<kbd>&rarrhk;</kbd>)
        2. Get (Value) for (choices) in (`$REPEAT-ITEM`)
        3. &rarr; Repeat with each item in (<kbd>&rarrhk;</kbd>)
            1. Get (Value) for (title) in (`$REPEAT-ITEM-2`) &rarr; `$MAGIC-enumTitle`
            2. Get (Value) for (code) in (`$REPEAT-ITEM-2`) &rarr; `$MAGIC-enumCode`
            3. Set (`$MAGIC-enumTitle`) to (`$MAGIC-enumCode`) in `$enumMap` &rarr; Set variable (enumMap) to (<kbd>&rarrhk;</kbd>)
            4. Text (`$MAGIC-enumTitle`)
        4. &rarr; Choose from (<kbd>&rarrhk;</kbd>), Prompt (`$name`: `$help`)
        5. &rarr; Get (Value) for (<kbd>&rarrhk;</kbd>) in (`enumMap`)
        6. &rarr; Set (`$name`) to (<kbd>&rarrhk;</kbd>) in `$output` &rarr; Set variable (output) to (<kbd>&rarrhk;</kbd>)
    13. *// Argument is STRING*
    14. If (`$type`) (is) (string)
        1. Ask for (Text) with (`$name`: `$help`)
        2. &rarr; Set (`$name`) to (<kbd>&rarrhk;</kbd>) in (`$output`) &rarr; Set variable (output) to (<kbd>&rarrhk;</kbd>)
    15. *// Argument is BOOLEAN*
    16. If (`$type`) (is) (boolean)
        1. Dictionary (&darr;) &rarr; `$MAGIC-BOOLEANS`
            1. (True) (Boolean) &rarr; (True)
            2. (False) (Boolean) &rarr; (False)
        2. &rarr; Choose from (<kbd>&rarrhk; as Keys</kbd>), Prompt: (`$name`: `$help`) &rarr; Get (Value) for (<kbd>&rarrhk;</kbd>) in (`$MAGIC-BOOLEANS`)
        3. &rarr; Set (`$name`) to (<kbd>&rarrhk;</kbd>) in (`$output`) &rarr; Set variable (output) to (<kbd>&rarrhk;</kbd>)
    17. *// Argument is DATE*
    18. If (`$type`) (is) (date)
        1. Ask for (Date and Time) with (`$name`: `$help`), Default Date and Time: (`$CURRENT-DATE`)
        2. &rarr; Format (<kbd>&rarrhk;</kbd>), Date Format: (RFC 2822)
        3. &rarr; Set (`$name`) to (<kbd>&rarrhk;</kbd>) in (`$output`) &rarr; Set variable (output) to (<kbd>&rarrhk;</kbd>)
14. Dictionary (&darr;) &rarr; Run (Scriptable Harness Run JS), Input: (<kbd>&rarrhk;</kbd>) &rarr; `$MAGIC-JS-OUTPUT`
    1. (name) (Text) &rarr; (`$script`)
    2. (mode) (Text) &rarr; (shortcuts.setArgs)
    3. (inScriptable) (Boolean) &rarr; (`$inScriptable`)
    4. (args) (Text) &rarr; (`$output`)
15. If (`$outputType`) (is) (data)
    1. Show notification (`$MAGIC-JS-OUTPUT`)
    2. Copy (`$MAGIC-JS-OUTPUT`) to clipboard


### Save to Files (Extension)

Accepts: Text

1. Text: "`$SHORTCUT-INPUT`"
2. Set name of (`$PREVIOUS`) to (Text) More(Don't Include File Extension: (On))
3. Save (`$PREVIOUS`) Service: (iCloud Drive) Ask Where to Save: (On)

