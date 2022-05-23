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

**encodeURIComponent** `encodeURIComponent(str: string): string`

  * The same as the DOM's `encodeURIComponent` function.
  * *Arguments:*
    * `str` (type: `string`): the string to encode
  * *Returns:*
    * (type: `string`): the encoded string

**wait** `wait(time: number): Promise<void>`

  * Waits for a given number of milliseconds before resolving.
  * *Arguments:*
    * `time` (type: `number`): the number of milliseconds to wait before resolving
  * *Returns:*
    * (type: `Promise<void>`): a promise resolving after `time` milliseconds

**stringToBytes** `stringToBytes(text: string): Uint8Array | Array<number>`

  * Given a string, converts it into a list of byte values.
  * *Arguments:*
    * `text` (type: `string`): the string to convert into bytes
  * *Returns:*
    * (type: `Uint8Array | Array<number>`): the bytes making up the string

**string** `string(str: any): string`

  * Given any object, returns it if it is a string, otherwise returns `''`.
  * *Arguments:*
    * `str` (type: `any`): the maybe-string to return
  * *Returns:*
    * (type: `string`): the passed in `str` if it is a string, otherwise `''`

**pathJoin** `pathJoin(segments: string): string`

  * Combines multiple path segments into a single path.
  * *Arguments:*
    * `segments` (type: `string`): the path segments to join together
  * *Returns:*
    * (type: `string`): a combination of all segments

**getInput** `getInput(argStructure: ArgStructure): Promise<ObjectMap<boolean|string>|null>`

  * This should be called at the beginning of every script. It gathers
input from the user in an environment-specific way. For instance, in
the CLI each argument is pulled from the flags, whereas in Scriptable
an argument-type-specific chooser UI is presented for each argument.<br/><br/>It returns a promise that resolves to an object. This object has one
key/value pair per `args[]` element. The keys correspond to the
`args[*].name` values, while the values are the user's responses as
strings (or booleans, for each `args[*].type === "boolean"`).<br/><br/>Alternatively, the returned promise may resolve to `null`. This signals
that the script should immediately exit. For example, `null` is returned
on a CLI given `-h` or `--help` flags, or when Shortcuts requests
argument metadata.
  * *Arguments:*
    * `argStructure` (type: `ArgStructure`): describes all inputs the user should
provide. See the "Helper Types" section of `api.md` for full details.
  * *Returns:*
    * (type: `Promise<ObjectMap<boolean|string>|null>`): Resolves to an object
with a key/value for each desired argument, or `null` if this script
should immediately terminate (ex: `--help` was asked for).

**compile** `compile(appPath: string)`

  * Compiles an HTML file at a given path and displays the result.
  * *Arguments:*
    * `appPath` (type: `string`): the path to the directory to compile

**showHtml** `showHtml(html: string)`

  * Displays some HTML to the user.
  * *Arguments:*
    * `html` (type: `string`): the html to show

**downloadText** `downloadText(url: string): Promise<string>`

  * Downloads some text from a given URL and returns the result.
  * *Arguments:*
    * `url` (type: `string`): the URL to download JSON from
  * *Returns:*
    * (type: `Promise<string>`): downloaded string, or null if invalid

**downloadJson** `downloadJson(url: string): Promise<Object|null>`

  * Downloads JSON from a given URL and returns the result.
  * *Arguments:*
    * `url` (type: `string`): the URL to download the JSON from
  * *Returns:*
    * (type: `Promise<Object|null>`): downloaded JSON or null if invalid

**downloadFile** `downloadFile(url: string, filePath: string): Promise<number>`

  * Downloads a file from a URL and stores it at the given filePath.
  * *Arguments:*
    * `url` (type: `string`): the URL to download from
    * `filePath` (type: `string`): the local path to store the file
  * *Returns:*
    * (type: `Promise<number>`): resolves to the status code for the request

**uploadForm** `uploadForm(url: string, form: ObjectMap<string>): Promise<string>`

  * POSTs some form data to a given URL.
  * *Arguments:*
    * `url` (type: `string`): the url to upload the form to
    * `form` (type: `ObjectMap<string>`): the form data to submit
  * *Returns:*
    * (type: `Promise<string>`): a promise resolving with the response body

**sendRequest** `sendRequest(url: string, headers: ObjectMap<string>, body: string, method: 'GET' | 'POST' | 'PUT'): Promise<string>`

  * Sends a generic request, returning the response string.
  * *Arguments:*
    * `url` (type: `string`): the URL to send the request to
    * `headers` (type: `ObjectMap<string>`): the map of header data to send
    * `body` (type: `string`): the body string data to send
    * `method` (type: `'GET' | 'POST' | 'PUT'`): the HTTP method to use
  * *Returns:*
    * (type: `Promise<string>`): a promise resolving to the response body

**uploadFile** `uploadFile(url: string, options: ObjectMap<string>, filePath: string): Promise<string>`

  * POSTs a file with a multipart form to a given URL.
  * *Arguments:*
    * `url` (type: `string`): the url to upload the data to
    * `options` (type: `ObjectMap<string>`): any extra parameters to add to body
    * `filePath` (type: `string`): the path to the file to upload
  * *Returns:*
    * (type: `Promise<string>`): a promise resolving with the response body

**readText** `readText(textPath: string): Promise<string|null>`

  * Reads a text file at a given path and returns the result.
  * *Arguments:*
    * `textPath` (type: `string`): the file path to the text file
  * *Returns:*
    * (type: `Promise<string|null>`): resolves to the text content

**readJson** `readJson(jsonPath: string): Promise<Object|null>`

  * Reads a JSON file at a given path and returns the result.
  * *Arguments:*
    * `jsonPath` (type: `string`): the file path to the JSON file
  * *Returns:*
    * (type: `Promise<Object|null>`): resolves to the object or null if invalid

**writeText** `writeText(textPath: string, text: string): Promise<void>`

  * Writes a string to a text file.
  * *Arguments:*
    * `textPath` (type: `string`): the file path to the text file to write
    * `text` (type: `string`): the text to write
  * *Returns:*
    * (type: `Promise<void>`): a promise resolving after the file is written

**writeJson** `writeJson(jsonPath: string, json: Object): Promise<void>`

  * Writes an object to a JSON file.
  * *Arguments:*
    * `jsonPath` (type: `string`): the file path to the JSON file to write
    * `json` (type: `Object`): the JSON object to write
  * *Returns:*
    * (type: `Promise<void>`): a promise resolving after the file is written

**writeBytes** `writeBytes(bytesPath: string, bytes: Array<number> | Uint8Array): Promise<void>`

  * Writes an array of bytes to a file at a particular path.
  * *Arguments:*
    * `bytesPath` (type: `string`): the file path to the binary file to write
    * `bytes` (type: `Array<number> | Uint8Array`): the list of bytes to write
  * *Returns:*
    * (type: `Promise<void>`): a promise resolving after the file is written

**listFiles** `listFiles(folderPath: string): Promise<Array<string>>`

  * Lists the files within a particular directory.
  * *Arguments:*
    * `folderPath` (type: `string`): the path whose children this lists
  * *Returns:*
    * (type: `Promise<Array<string>>`): a promise resolving with the list of names

**isFile** `isFile(filePath: string): Promise<boolean>`

  * Gets whether or not a path is a file that exists.
  * *Arguments:*
    * `filePath` (type: `string`): the path to the potential file
  * *Returns:*
    * (type: `Promise<boolean>`): true if the path is an existing file

**isDirectory** `isDirectory(folderPath: string): Promise<boolean>`

  * Gets whether or not a given path is a directory
  * *Arguments:*
    * `folderPath` (type: `string`): the path to the file or folder
  * *Returns:*
    * (type: `Promise<boolean>`): true if a folder is at `folderPath`

**getFileSize** `getFileSize(filePath: string): Promise<number>`

  * Gets the size of a file in kilobytes (floored).
  * *Arguments:*
    * `filePath` (type: `string`): the path to the file whose size we get
  * *Returns:*
    * (type: `Promise<number>`): the size of the file, in kilobytes

**makeDirectory** `makeDirectory(folderPath: string): Promise<boolean>`

  * Creates a folder at a given path.
  * *Arguments:*
    * `folderPath` (type: `string`): the path to the folder to create
  * *Returns:*
    * (type: `Promise<boolean>`): true if the folder was created

**moveFile** `moveFile(sourcePath: string, destinationPath: string): Promise<boolean>`

  * Moves a file from one path to another.
  * *Arguments:*
    * `sourcePath` (type: `string`): the path to read a file from
    * `destinationPath` (type: `string`): the path to move the file to
  * *Returns:*
    * (type: `Promise<boolean>`): resolves to true when move is successful

**copyFile** `copyFile(sourcePath: string, destinationPath: string): Promise<boolean>`

  * Copies a file from one path to another.
  * *Arguments:*
    * `sourcePath` (type: `string`): the path to read a file from
    * `destinationPath` (type: `string`): the path to copy the file to
  * *Returns:*
    * (type: `Promise<boolean>`): resolves to true when copy is successful

**open** `open(url: string)`

  * Opens a given URL in safari or the program handling the given protocol.
  * *Arguments:*
    * `url` (type: `string`): the url to open

**status** `status(msg: string)`

  * Prints a transient info status message.
  * *Arguments:*
    * `msg` (type: `string`): the message. Should not be important.

**log** `log(msg: string)`

  * Prints a permanent informational log message.
  * *Arguments:*
    * `msg` (type: `string`): the message to log until the end of the app

**output** `output(title: string | null, data: string | number | boolean)`

  * Prints the final output of the program.
  * *Arguments:*
    * `title` (type: `string | null`): a string describing the final output
    * `data` (type: `string | number | boolean`): the easy-to-copy final output

**error** `error(title: string, data: string | number | boolean)`

  * Shows an error message.
  * *Arguments:*
    * `title` (type: `string`): the title of the script that threw
    * `data` (type: `string | number | boolean`): the easy-to-copy final output string

**copy** `copy(data: string)`

  * Puts a string onto the clipboard.
  * *Arguments:*
    * `data` (type: `string`): the string to put onto the clipboard

**paste** `paste(): string`

  * Gets the data that's on the clipboard
  * *Returns:*
    * (type: `string`): the data that was on the clipboard

**external** ``

  * A collection of useful third-party libraries.
See lib/external/entry.js.



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

