# API Documentation

Non-standard types (ex: `ObjectMap`) are defined in the **Helper Types** section at the bottom of this document.

Note that for all functions, paths may have the following prefixes:

| Prefix | Description                                                    |
| ------ | -------------------------------------------------------------- |
| `$`    | This refers to the Scriptable folder containing the JS script. |
| `.`    | This refers to the working directory for CLI users.            |
| `/`    | This refers to the root directory for CLI users.               |

Example: `$/lib/api.md` refers to this file.

## Exported Functions and Constants

The following are all constants and functions available when the bridge is imported.

{{FUNCTIONS}}

## Helper Types

### ObjectMap

An `ObjectMap<T>` is a simple object with `string` keys and `T` values.

For example, `{ a: 1, b: 2 }` is an `ObjectMap<number>`.

### ArgStructure

This structure describes what inputs `getInput` should ask the user for.

It consists of an object with these properties:

| Property       | Type               | Use  |
| -------------- | ------------------ | ---- |
| `help`         | `string`           | The help message to show the user (with `-h` or `--help` on CLI). |
| `inScriptable` | `boolean`          | If true, always open the Scriptable app when Shortcuts runs this. |
| `args`         | `ArgDescription[]` | A description of each input we ask the user for with UI or flags (CLI). |

### ArgDescription

`ArgDescription` objects describe a single input we ask the user for. They contain:

| Property       | Type      | Use  |
| -------------- | --------- | ---- |
| `name`         | `string`  | The user-readable name of this argument. It is shown to the user when asking for this argument in Shortcuts and Scriptable. For CLI users, it can be used with two dashes (ex: if `name: "foobar"`, a CLI user could provide `--foobar value`). |
| `shortName`    | `string`  | A code-name for this argument. Only used as a shortcut for CLI users (ex: if `shortName: "f"`, a CLI user could provide `-f value`). |
| `help`         | `string`  | The documentation text shown to Shortcuts and Scriptable users when they are asked to provide a value, and shown to CLI users when they use the `-h` or `--help` flag. |
| `share`        | `boolean` | (*optional, default:* `false`). If true, anything sent into this script from the share-sheet (in Shortcuts or Scriptable) will be the value provided for this argument. |
| `type`         | String Values:<br/>`"boolean"`<br/>`"string"`<br/>`"date"`<br/>`"enum"`<br/>`"pathFolder"`<br/>`"pathFile"` | Describes the data type being asked for in this input. In Shortcuts and Scriptable, this determines the UI that appears to choose the value (ex: a `True` / `False` dialog if `type: "boolean"`, a calendar and time picker if `type: "date"`, etc). |
| `choices`      | `ArgChoice[]` | *Only use if:* `type: "enum"`<br/><br/>This is a list of all possible values for this input. The user chooses from these with UI in Shortcuts and Scriptable. For CLI users, these are displayed in the `-h` / `--help` documentation. |
| `bookmarkName` | `string`      | *Only use if:* `type: "pathFolder"` *or* `type: "pathFile"`<br/><br/>This is a unique ID for this document (used by Shortcuts/Scriptable). |
| `pathType`     | String Values:<br/>`"public.folder"`<br/>`"public.json"`<br/>`"public.plain-text"`<br/>`"public.image"` | *Only use if:* `type: "pathFolder"` *or* `type: "pathFile"`<br/><br/>(*optional*) This describes allowed file types. Ex: `pathType: "public.json"` only allows users to choose JSON files. |

### ArgChoice

`ArgChoice` is a simple object describing an enumeration choice. It contains:

| Property | Type     | Use  |
| -------- | -------- | ---- |
| `title`  | `string` | The user-readable name for this argument presented by Shortcuts or Scriptable |
| `code`   | `string` | The unique value for this argument passed in by CLI users. This value is what actually populates the returned variable, regardless of which environment is used (i.e. even though Shortcuts/Scriptable users choose an option listed by `title`, the bridge will be return the corresponding `code`). |

