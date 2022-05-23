/* globals args DocumentPicker Alert FileManager WebView Safari Script */
/* globals Pasteboard DatePicker importModule */
///<reference path="../types/scriptable.d.ts" />
///<reference path="../types/lib.d.ts" />

const {
    DatePicker, Request, Alert, DocumentPicker, FileManager, WebView, args,
    Script, Safari, Notification, Pasteboard, importModule, Data
} = /** @type {Scriptable}*/(/** @type {any}*/(this));

/** @type {import("./external/external.cjs")} */
const external = importModule('./external/external.cjs.js');

const scriptableCopyUri = 'scriptable:///run' +
    '?scriptName=ScriptableHelperCopy' +
    '&text=';

let logView = /** @type {Scriptable.WebView|null} */(null);
let log = '';
let status = '';
const b64Digits =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';

/**
 * The same as the DOM's `encodeURIComponent` function.
 * @param {string} str the string to encode
 * @return {string} the encoded string
 */
const encodeUriComponent = str => {
    const hexDigits = '0123456789ABCDEF';
    let ret = '';
    for(let i = 0; i < str.length; i += 1) {
        const char = str.charCodeAt(i);
        const isValid =
            (char >= 48 && char <= 57 ) || // 0-9
            (char >= 97 && char <= 122) || // a-z
            (char >= 65 && char <= 90 ) || // A-Z
            (char >= 39 && char <= 42 ) || // '()*
            (char >= 45 && char <= 46 ) || // -.
            char === 95 || char === 126 || char === 33; // _~!

        ret += isValid
            ? str[i]
            : '%' + hexDigits[(char & 0xF0) >> 4] + hexDigits[(char & 0x0F)];
    }
    return ret;
};

/**
 * Given an array of bytes, create a base64 string.
 * @param {number[]|Uint8Array} bytes the byte list to encode
 * @return {string} the bytes, converted to base-64
 */
const bytesToBase64 = bytes => {
    let result = '';
    const remainder = bytes.length % 3;

    for(let i = 0; i < bytes.length; i += 3) {
        const byte1 = Math.floor(bytes[i] || 0);
        const byte2 = Math.floor(bytes[i + 1] || 0);
        const byte3 = Math.floor(bytes[i + 2] || 0);

        const bitmap = (byte1 << 16) | (byte2 << 8) | byte3;
        result +=
            b64Digits.charAt(bitmap >> 18 & 63) +
            b64Digits.charAt(bitmap >> 12 & 63) +
            b64Digits.charAt(bitmap >> 6 & 63) +
            b64Digits.charAt(bitmap & 63);
    }

    return remainder
        ? result.slice(0, remainder - 3) + '==='.substring(remainder)
        : result;
};


// Helper Functions

/**
 * Parses a JSON string, returning `null` if it fails to parse.
 * @param {string|null} json the JSON to parse
 * @param {boolean} [adaptJs] if explicitly true, also read single-export JS
 * @return {Object|null}
 */
const jsonParse = (json, adaptJs) => {
    if (!json) { return null; }
    const removeExport = /^export const \w+\s*=\s*/gm;
    const jsonNoExport = adaptJs ? json.replace(removeExport, '') : json;
    try { return external.json5.parse(jsonNoExport); } catch(e) { }
    return null;
};

/**
 *
 * @param {string} path
 * @return {string}
 */
const resolvePath = path => {
    const fm = FileManager.iCloud();
    const rootPath = fm.documentsDirectory();
    return path
        .replace(/^[$.]/, rootPath)
        .replace(/\/\//g, '/');
};

/**
 * Given HTML body content, returns an HTML page.
 * @param {string} statusText the content to put in the status div
 * @param {string} logText the content to put in the log div
 * @return {string} the full HTML content
 */
const html = (statusText, logText) => external.markedTemplates.html(
    `<div class="status">${statusText}</div><div class="log">${logText}</div>`,
    `body { font-family: -apple-system, Helvetica, sans-serif; }
    .status { font-size: 30px; }
    .log { font-size: 20px; }`
);

/**
 * Displays a "logging" window showing a status and list of log lines.
 * @param {string|null} statusMessage a new status, or null to not update
 * @param {string|null} logMessage a new log to append, or null to not append
 */
const showWebLog = (statusMessage, logMessage) => {
    status = statusMessage === null ? status : statusMessage;
    log += logMessage === null ? '' : logMessage + '<br/>';

    const isNewWebView = !logView;
    logView = logView || new WebView();
    logView.loadHTML(html(status, log));
    if (isNewWebView) {
        logView.present();
    }
};

/**
 * Formats the "help" messages passed into the getInput function.
 * @param {string} help the message to format
 * @return {string} the formatted message
 */
const formatHelp = help => help.replace(/[ \n\r]+/gm, ' ');


/**
 * @param {ObjectMap<string>} map the key/value map to encode
 * @return {string} the encoded map
 */
const encodeUriMap = map =>
    Object.entries(map)
        .map(([k, v]) => encodeUriComponent(k) + '=' + encodeUriComponent(v))
        .join('&');

module.exports.encodeURIComponent = encodeUriComponent;

/**
 * Waits for a given number of milliseconds before resolving.
 * @param {number} time the number of milliseconds to wait before resolving
 * @return {Promise<void>} a promise resolving after `time` milliseconds
 */
module.exports.wait = time => new Promise(yes => setTimeout(() => yes(), time));

/**
 * Given a string, converts it into a list of byte values.
 * @param {string} text the string to convert into bytes
 * @return {Uint8Array|number[]} the bytes making up the string
 */
module.exports.stringToBytes = text => Data.fromString(text).getBytes();

/**
 * Given any object, returns it if it is a string, otherwise returns `''`.
 * @param {string} str the maybe-string to return
 * @return {string} the passed in `str` if it is a string, otherwise `''`
 */
module.exports.string = str => typeof str === 'string' ? str : '';

/**
 * Combines multiple path segments into a single path.
 * @param {...string} segments the path segments to join together
 * @return {string} a combination of all segments
 */
module.exports.pathJoin = (...segments) => {
    /** @type {string[]} */
    const output = [ ];
    for(const segment of segments.flatMap(x => x.split('/'))) {
        if (segment === '..') {
            output.pop();
        } else if (segment !== '' && segment !== '.') {
            output.push(segment);
        }
    }
    return (segments[0].charAt(0) === '/' ? '/' : '') + output.join('/');
};

/**
 * This should be called at the beginning of every script. It gathers
 * input from the user in an environment-specific way. For instance, in
 * the CLI each argument is pulled from the flags, whereas in Scriptable
 * an argument-type-specific chooser UI is presented for each argument.
 * 
 * It returns a promise that resolves to an object. This object has one
 * key/value pair per `args[]` element. The keys correspond to the
 * `args[*].name` values, while the values are the user's responses as
 * strings (or booleans, for each `args[*].type === "boolean"`).
 *
 * Alternatively, the returned promise may resolve to `null`. This signals
 * that the script should immediately exit. For example, `null` is returned
 * on a CLI given `-h` or `--help` flags, or when Shortcuts requests
 * argument metadata.
 *
 * @param {ArgStructure} argStructure describes all inputs the user should
 * provide. See the "Helper Types" section of `api.md` for full details.
 * @return {Promise<ObjectMap<boolean|string>|null>} Resolves to an object
 * with a key/value for each desired argument, or `null` if this script
 * should immediately terminate (ex: `--help` was asked for).
 */
module.exports.getInput = async (argStructure) => {
    const result = /** @type {ObjectMap<boolean|string>} */({});
    let shareIndex = 0;

    const command = args.plainTexts[1] || args.urls[1] || '';

    if (command === 'shortcuts.getArgs') {
        const fm = FileManager.local();
        argStructure.bookmarks = fm.allFileBookmarks()
            .filter(x => x.source === 'siri_shortcuts')
            .map(x => x.name);
        Script.setShortcutOutput(JSON.stringify(argStructure));
        Script.complete();
        return null;
    }

    if (command === 'shortcuts.setArgs') {
        const fm = FileManager.local();
        try {
            const jsonString = args.plainTexts[0] || args.urls[0] || '{}';
            const argMap = JSON.parse(jsonString);

            for(const arg of argStructure.args) {
                const value = argMap[arg.name];
                if (arg.type === 'pathFile') {
                    try {
                        argMap[arg.name] = fm.bookmarkedPath(value) || value;
                    } catch(e) {
                        argMap[arg.name] = value;
                    }
                } else if (arg.type === 'pathFolder') {
                    const popup = new Alert();
                    popup.title = arg.name;
                    popup.message = formatHelp(arg.help);
                    popup.addAction('Choose Folder');
                    await popup.presentAlert();
                    argMap[arg.name] = await DocumentPicker.openFolder();
                }
            }

            return argMap;
        } catch(e) { return { }; }
    }

    for(const arg of argStructure.args) {
        const sharedArg = args.plainTexts[shareIndex] || args.urls[shareIndex];

        if (arg.share && typeof sharedArg === 'string') {
            result[arg.name] = sharedArg;
            shareIndex += 1;

        } else if (arg.type === 'pathFolder') {
            const popup = new Alert();
            popup.title = arg.name;
            popup.message = formatHelp(arg.help);
            popup.addAction('Choose Folder');
            await popup.presentAlert();
            result[arg.name] = await DocumentPicker.openFolder();

        } else if (arg.type === 'pathFile') {
            const popup = new Alert();
            popup.title = arg.name;
            popup.message = formatHelp(arg.help);
            popup.addAction('Choose File');
            await popup.presentAlert();
            result[arg.name] = arg.pathType
                ? (await DocumentPicker.open([ arg.pathType ]))[0]
                : await DocumentPicker.openFile();

        } else if (arg.type === 'enum' && arg.choices.length) {
            const menu = new Alert();
            menu.title = arg.name;
            menu.message = formatHelp(arg.help);
            arg.choices.forEach(x => menu.addAction(x.title));
            const chosen = await menu.presentSheet();
            result[arg.name] = arg.choices[chosen || 0].code;

        } else if (arg.type === 'boolean') {
            const popup = new Alert();
            popup.title = arg.name;
            popup.message = formatHelp(arg.help);
            popup.addAction('No');
            popup.addAction('Yes');
            result[arg.name] = (await popup.presentAlert()) === 1;

        } else if (arg.type === 'string') {
            const popup = new Alert();
            popup.title = arg.name;
            popup.message = formatHelp(arg.help);
            popup.addTextField('Type a Value Here', '');
            popup.addAction('OK');
            await popup.presentAlert();
            result[arg.name] = popup.textFieldValue(0);

        } else if (arg.type === 'date') {
            const picker = new DatePicker();
            picker.initialDate = new Date();
            const picked = await picker.pickDateAndTime();
            result[arg.name] = picked.getTime().toString();
        }
    }

    return result;
};

/**
 * Compiles an HTML file at a given path and displays the result.
 * @param {string} appPath the path to the directory to compile
 */
module.exports.compile = async (appPath) => {
    const srcRegex = /src\s*=\s*['"]([^'"]*)['"]/;
    const hrefRegex = /href\s*=\s*['"]([^'"]*)['"]/;
    const relRegex = /rel\s*=\s*['"]stylesheet['"]/;
    const dotRegex = /^\.\//;

    appPath = resolvePath(appPath);
    const fm = FileManager.iCloud();
    const htmlPath = fm.joinPath(appPath, 'index.html');

    /** @type {(path: string) => string} */
    const loadFile = path => {
        const content = fm.readString(path);
        if (content !== null) { return content; }
        return '';
    };

    const html = loadFile(htmlPath);

    const transformedHtml = html.replace(/<(script|link)[^>]*>/g, tag => {
        const srcMatch  = tag.match(srcRegex);
        const hrefMatch = tag.match(hrefRegex);
        const src  = srcMatch  && srcMatch[1];
        const href = hrefMatch && hrefMatch[1];
        const isStyle = relRegex.test(tag);
        if (src) {
            const resPath = fm.joinPath(appPath, src.replace(dotRegex, ''));
            const resText = loadFile(resPath) || 'null';
            return tag.replace(srcRegex, `data-name="${src}"`) + '\n' +
                resText + '\n';
        }
        if (isStyle && href) {
            const resPath = fm.joinPath(appPath, href.replace(dotRegex, ''));
            const resText = loadFile(resPath) || '/* CSS NOT LOADED */';
            return '<style>\n' + resText + '\n</style>';
        }
        return tag;
    });

    WebView.loadHTML(transformedHtml, '', undefined, true);
};

/**
 * Displays some HTML to the user.
 * @param {string} html the html to show
 */
module.exports.showHtml = async (html) => {
    WebView.loadHTML(html, '', undefined, true);
};

/**
 * Downloads some text from a given URL and returns the result.
 * @param {string} url the URL to download JSON from
 * @return {Promise<string>} downloaded string, or null if invalid
 */
module.exports.downloadText = async (url) =>
    await (new Request(url)).loadString();

/**
 * Downloads JSON from a given URL and returns the result.
 * @param {string} url the URL to download the JSON from
 * @return {Promise<Object|null>} downloaded JSON or null if invalid
 */
module.exports.downloadJson = async (url) => {
    const searchReq = new Request(url);
    return jsonParse(await searchReq.loadString());
};

/**
 * Downloads a file from a URL and stores it at the given filePath.
 * @param {string} url the URL to download from
 * @param {string} filePath the local path to store the file
 * @return {Promise<number>} resolves to the status code for the request
 */
module.exports.downloadFile = async (url, filePath) => {
    const fileReq = new Request(url);
    const file = await fileReq.load();
    const statusCode = Number(fileReq.response['statusCode']) || 0;
    if (statusCode === 200) {
        FileManager.local().write(resolvePath(filePath), file);
    }
    return statusCode;
};

/**
 * POSTs some form data to a given URL.
 * @param {string} url the url to upload the form to
 * @param {ObjectMap<string>} form the form data to submit
 * @return {Promise<string>} a promise resolving with the response body
 */
module.exports.uploadForm = async (url, form) => {
    const formEncoded = encodeUriMap(form);

    const request = new Request(url);
    request.method = 'POST';
    request.headers = {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'Content-Length': formEncoded.length.toString()
    };
    request.body = formEncoded;

    return await request.loadString();
};

/**
 * Sends a generic request, returning the response string.
 * @param {string} url the URL to send the request to
 * @param {ObjectMap<string>} [headers] the map of header data to send
 * @param {string} [body] the body string data to send
 * @param {'GET'|'POST'|'PUT'} [method='POST'] the HTTP method to use
 * @return {Promise<string>} a promise resolving to the response body
 */
module.exports.sendRequest = async (url, headers, body, method) => {
    const request = new Request(url);
    request.method = method ?? 'POST';
    request.headers = headers ?? { };
    request.body = body ?? '';
    return await request.loadString();
};

/**
 * POSTs a file with a multipart form to a given URL.
 * @param {string} url the url to upload the data to
 * @param {ObjectMap<string>} options any extra parameters to add to body
 * @param {string} filePath the path to the file to upload
 * @return {Promise<string>} a promise resolving with the response body
 */
module.exports.uploadFile = async (url, options, filePath) => {
    const request = new Request(url);
    request.method = 'POST';

    for(const key in options) {
        request.addParameterToMultipart(key, options[key]);
    }

    request.addFileToMultipart(filePath, 'files[]');

    return await request.loadString();
};

/**
 * Reads a text file at a given path and returns the result.
 * @param {string} textPath the file path to the text file
 * @return {Promise<string>} resolves to the text content
 */
module.exports.readText = async (textPath) =>
    FileManager.local().readString(resolvePath(textPath));

/**
 * Reads a JSON file at a given path and returns the result.
 * @param {string} jsonPath the file path to the JSON file
 * @return {Promise<Object|null>} resolves to the object or null if invalid
 */
module.exports.readJson = async jsonPath =>
    jsonParse(FileManager.local().readString(resolvePath(jsonPath)), true);

/**
 * Writes a string to a text file.
 * @param {string} textPath the file path to the text file to write
 * @param {string} text the text to write
 * @return {Promise<void>} a promise resolving after the file is written
 */
module.exports.writeText = async (textPath, text) => {
    FileManager.local().writeString(resolvePath(textPath), text);
};

/**
 * Writes an object to a JSON file.
 * @param {string} jsonPath the file path to the JSON file to write
 * @param {Object} json the JSON object to write
 * @return {Promise<void>} a promise resolving after the file is written
 */
module.exports.writeJson = async (jsonPath, json) => {
    const fm = FileManager.local();
    fm.writeString(resolvePath(jsonPath), JSON.stringify(json, null, '  '));
};

/**
 * Writes an array of bytes to a file at a particular path.
 * @param {string} bytesPath the file path to the binary file to write
 * @param {number[]|Uint8Array} bytes the list of bytes to write
 * @return {Promise<void>} a promise resolving after the file is written
 */
module.exports.writeBytes = async (bytesPath, bytes) => {
    const data = Data.fromBase64String(bytesToBase64(bytes));
    FileManager.local().write(resolvePath(bytesPath), data);
};

/**
 * Lists the files within a particular directory.
 * @param {string} folderPath the path to the folder whose children this lists
 * @return {Promise<string[]>} a promise resolving with the list of file names
 */
module.exports.listFiles = async (folderPath) => {
    //const fileNames = filePaths.map(x => x.replace(/^.*\/([^/]+)\/?$/, '$1'));
    const local = FileManager.local();
    return local.fileExists(folderPath) ? local.listContents(folderPath) : [ ];
};

/**
 * Gets whether or not a path is a file that exists.
 * @param {string} filePath the path to the potential file
 * @return {Promise<boolean>} true if the path is an existing file
 */
module.exports.isFile = async (filePath) =>
    FileManager.local().fileExists(filePath) &&
        !FileManager.local().isDirectory(filePath);

/**
 * Gets whether or not a given path is a directory
 * @param {string} folderPath the path to the file or folder
 * @return {Promise<boolean>} true if a folder is at `folderPath`
 */
module.exports.isDirectory = async (folderPath) =>
    FileManager.local().isDirectory(folderPath);

/**
 * Gets the size of a file in kilobytes (floored).
 * @param {string} filePath the path to the file whose size we get
 * @return {Promise<number>} the size of the file, in kilobytes
 */
module.exports.getFileSize = async (filePath) =>
    FileManager.local().fileSize(filePath);

/**
 * Creates a folder at a given path.
 * @param {string} folderPath the path to the folder to create
 * @return {Promise<boolean>} true if the folder was created
 */
module.exports.makeDirectory = async folderPath => {
    FileManager.local().createDirectory(folderPath, true);
    return true;
};

/**
 * Moves a file from one path to another.
 * @param {string} sourcePath the path to read a file from
 * @param {string} destinationPath the path to move the file to
 * @return {Promise<boolean>} resolves to true when move is successful
 */
module.exports.moveFile = async (sourcePath, destinationPath) => {
    if (sourcePath !== destinationPath) {
        FileManager.local().move(sourcePath, destinationPath);
    }
    return true;
};

/**
 * Copies a file from one path to another.
 * @param {string} sourcePath the path to read a file from
 * @param {string} destinationPath the path to copy the file to
 * @return {Promise<boolean>} resolves to true when copy is successful
 */
module.exports.copyFile = async (sourcePath, destinationPath) => {
    const local = FileManager.local();
    if (!local.fileExists(sourcePath)) {
        return false;
    }
    if (sourcePath !== destinationPath) {
        if (local.fileExists(destinationPath)) {
            local.remove(destinationPath);
        }
        local.copy(sourcePath, destinationPath);
    }
    return true;
};

/**
 * Opens a given URL in safari or the program handling the given protocol.
 * @param {string} url the url to open
 */
module.exports.open = url => { Safari.open(url); };

/**
 * Prints a transient info status message.
 * @param {string} msg the message. Should not be important.
 */
module.exports.status = (msg) => showWebLog(msg, null);

/**
 * Prints a permanent informational log message.
 * @param {string} msg the message to log until the end of the app
 */
module.exports.log = (msg) => showWebLog(null, msg);

/**
 * Prints the final output of the program.
 * @param {string|null} title a string describing the final output
 * @param {string|number|boolean} data the easy-to-copy final output
 */
const output = (title, data) => {
    const message = '' + data;
    const messageUri = encodeURIComponent(message);

    if (title) {
        const notification = new Notification();
        notification.title = title;
        notification.subtitle = message;
        notification.addAction('Copy', scriptableCopyUri + messageUri);
        notification.schedule();
    }

    Script.setShortcutOutput(message);
    Script.complete();
};

module.exports.output = output;

/**
 * Shows an error message.
 * @param {string} title the title of the script that threw
 * @param {string|number|boolean} data the easy-to-copy final output string
 */
module.exports.error = (title, data) => { output('Error: ' + title, data); };

/**
 * Puts a string onto the clipboard.
 * @param {string} data the string to put onto the clipboard
 */
module.exports.copy = (data) => { Pasteboard.copyString(data); };

/**
 * Gets the data that's on the clipboard
 * @return {string} the data that was on the clipboard
 */
module.exports.paste = () => Pasteboard.pasteString();

/**
 * A collection of useful third-party libraries.
 * See lib/external/entry.js.
 */
module.exports.external = external;

