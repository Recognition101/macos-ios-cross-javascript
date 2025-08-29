/* eslint-disable no-console */
///<reference path="../types/lib.d.ts" />

const fs = require('fs');
const os = require('os');
const path = require('path');
const proc = require('child_process');
const http = require('http');
const https = require('https');
const urlLib = require('url');
const querystring = require('querystring');
const rootDir = path.dirname((require.main && require.main.filename) || '');
const external = require('./external/external.cjs.js');

const srcRegex = /src\s*=\s*['"]([^'"]*)['"]/;
const hrefRegex = /href\s*=\s*['"]([^'"]*)['"]/;
const relRegex = /rel\s*=\s*['"]stylesheet['"]/;
const tmpPath = '/tmp/compiled-scriptable-app.html';
const space = '                                                              ';
/** @type {ArgStructureOutputType|undefined} */
let outputType = undefined;

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
 * Resolves a file path to an absolute file path.
 * @param {string} filePath the file-path to resolve
 * @return {string} the resolved file-path
 */
const resolvePath = filePath => path.resolve(filePath
    .replace(/^~/, os.homedir())
    .replace(/^\$/, rootDir)
    .replace(/\/\//g, '/'));

/**
 * Reads a file and returns its contents as a promise.
 * @param {string} filePath the path to the file to read
 * @return {Promise<Buffer|null>} the file contents
 */
const readFileBuffer = (filePath) =>
    new Promise(yes =>
        fs.readFile(resolvePath(filePath), (e, data) => yes(e ? null : data))
    );

/**
 * Reads a file from the filesystem and returns a string of its contents.
 * @param {string} filePath the path to the file to read
 * @return {Promise<string|null>} a promise resolving to the file contents
 */
const readFile = async filePath => {
    const buffer = await readFileBuffer(filePath);
    return buffer && buffer.toString();
};

/**
 * Writes data to a file at a given path.
 * @param {string} dataPath the file path to write data into
 * @param {string|Buffer} data the data to write
 * @return {Promise<void>} a promise resolving after the file is written
 */
const writeData = (dataPath, data) =>
    new Promise((yes, no) => {
        fs.writeFile(resolvePath(dataPath), data, e => e ? no(e) : yes());
    });

/**
 * Saves an argument structure object to the argument cache.
 * @param {ArgStructure} argStructure the argument structure to write
 * @return {Promise<void>} a promise resolving after the file is written
 */
const cacheArgStructure = async (argStructure) =>
    await writeData(
        `$/args/${argStructure.name}.json`,
        JSON.stringify(argStructure, null, '    ')
    );

/**
 * Parses the CLI arguments and returns a map of them.
 * @return {Object<string, boolean|string>} a map of argument keys to values
 */
const parseArgs = () => {
    const result = /** @type {Object<string, boolean|string>} */({});
    for(let i = 2, key = ''; i < process.argv.length; i += 1) {
        const isKey = process.argv[i].startsWith('-');
        key = isKey ? process.argv[i].replace(/^-*/, '') : key;
        result[key] = key ? (isKey ? true : process.argv[i]) : '';
        key = isKey ? key : '';
    }
    return result;
};

/**
 * Downloads some text from a given URL and returns the result.
 * @param {string} url the URL to download JSON from
 * @param {'GET'|'POST'|'PUT'} [type] the type of HTTP request this is
 * @param {ObjectMap<string>} [headers] extra headers to add
 * @param {Buffer|string|undefined|null} [body] optional body to send
 * @return {Promise<string>} downloaded string, or null if invalid
 */
const sendRequest = (url, type='GET', headers, body) =>
    new Promise((yes, no) => {
        const urlParsed = new urlLib.URL(url);
        const isSecure = urlParsed.protocol === 'https:';
        const createRequest = isSecure ? https.request : http.request;
        let data = '';

        const options = {
            hostname: urlParsed.hostname,
            port: urlParsed.port,
            path: urlParsed.pathname + (urlParsed.search || ''),
            method: type,
            headers: headers || { }
        };

        const request = createRequest(options, response => {
            response.on('data', chunk => { data += chunk; });
            response.on('error', e => no(e));
            response.on('end', () => yes((data)));
        });
        request.on('error', e => no(e));
        if (body) {
            request.write(body);
        }
        request.end();
    });

/**
 * Gets a more generic version of a given string
 * @param {string} string the string to get a more generic version of
 * @return {string} `string`, converted to lowercase ascii alphabet letters
 */
const getFuzzedString = string => string
    .toLowerCase()
    .normalize('NFD')
    .replace(/[^-_\w]/g, '');

/**
 * Given any object, returns it if it is a string, otherwise returns `''`.
 * @param {any} str the maybe-string to return
 * @return {string} the passed in `str` if it is a string, otherwise `''`
 */
const string = str => typeof str === 'string' ? str : '';

/**
 * Runs a function. If it throws, returns null.
 * @template {Function} T
 * @param {T} fn the function to run
 * @return {ReturnType<T>|null} the return value, or null
 */
const tryNull = fn => {
    try { return fn(); } catch(_e) { }
    return null;
};

///**
// * Given a list of items, gets a string that attempts to keep them wrapped
// * within a given character count.
// * @param {string} indent any spacing to prefix each line with
// * @param {string[]} items the items to append together
// * @param {number} length the maximum character count we try to stay within
// * @return {string} the wrapped text
// */
//const wrapText = (indent, items, length) => {
//    if (items.length === 0) {
//        return '';
//    }
//    /** @type {string[][]} */
//    const lines = [ [ ] ];
//    let count = indent.length;
//    for (const token of items) {
//        if (count + token.length > length) {
//            lines[lines.length - 1].push('');
//            lines.push([]);
//            count = indent.length;
//        }
//        lines[lines.length - 1].push(token);
//        count += token.length + 2;
//    }
//    return lines.map(line => indent + line.join(', ')).join('\n');
//};

module.exports = {
    /**
     * The same as the DOM's `encodeURIComponent` function.
     * @param {string} str the string to encode
     * @return {string} the encoded string
     */
    encodeURIComponent: str => encodeURIComponent(str),

    /**
     * The same as the DOM's `decodeURIComponent` function.
     * @param {string} input the string to decode
     * @return {string|null} decoded text, or null if `input` is malformed
     */
    decodeURIComponent: input => tryNull(() => decodeURIComponent(input)),

    /**
     * The same as the browser's `atob` function.
     * @param {string} data the data to decode from base64
     * @return {string|null} the text, or null if `data` is not valid base64
     */
    atob: data => tryNull(() => atob(data)),

    /**
     * The same as the browser's `btoa` function.
     * @param {string} text the text to encode into base64
     * @return {string|null} base64 text, or `null` if it could not encode
     */
    btoa: text => tryNull(() => btoa(text)),

    /**
     * Waits for a given number of milliseconds before resolving.
     * @param {number} time the number of milliseconds to wait before resolving
     * @return {Promise<void>} a promise resolving after `time` milliseconds
     */
    wait: time => new Promise(yes => setTimeout(() => yes(), time)),

    /**
     * Given a string, converts it into a list of byte values.
     * @param {string} text the string to convert into bytes
     * @return {Uint8Array|number[]} the bytes making up the string
     */
    stringToBytes: text => (new TextEncoder()).encode(text),

    /**
     * Given any object, returns it if it is a string, otherwise returns `''`.
     * @param {any} str the maybe-string to return
     * @return {string} the passed in `str` if it is a string, otherwise `''`
     */
    string: string,

    /**
     * Combines multiple path segments into a single path.
     * @param {...string} segments the path segments to join together
     * @return {string} a combination of all segments
     */
    pathJoin: (...segments) => path.join(...segments),

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
     * @param {boolean} [cacheArgs] if `true`, write these args to the cache
     * @return {Promise<ObjectMap<boolean|string>|null>} Resolves to an object
     * with a key/value for each desired argument, or `null` if this script
     * should immediately terminate (ex: `--help` was asked for).
     */
    getInput: async (argStructure, cacheArgs) => {
        outputType = argStructure.outputType;

        let pipedInput = '';
        if (!process.stdin.isTTY) {
            for await (const chunk of process.stdin) {
                pipedInput += chunk;
            }
            pipedInput = pipedInput.trim();
        }
        
        const args = parseArgs();
        const argSpecs = argStructure.args ?? [ ];

        if (cacheArgs || args['cache-args']) {
            await cacheArgStructure(argStructure);
        }
        if (args['cache-args']) {
            console.log(`Arguments cached for: ${argStructure.name}`);
            return null;
        }

        if (args['h'] || args['help']) {
            const argNames = argSpecs.map(
                a => `  --${a.name}, -${a.shortName}`
            );
            const maxNameLength = Math.max(...argNames.map(x => x.length)) + 4;

            const optsString = argSpecs.map((arg, i) => {
                const space = ' '.repeat(maxNameLength - argNames[i].length);
                const spaceMax = ' '.repeat(maxNameLength);
                const help = arg.help.replace(/\n/g, '\n' + spaceMax);

                const helpLine = `${argNames[i]}${space}${help}`;

                if (arg.type === 'enum') {
                    const choicesText = arg.choices
                        .map(x => `${spaceMax}    - ${x.code}`)
                        .join('\n');
                    return `${helpLine}\n${spaceMax}VALUES:\n${choicesText}`;
                }

                return helpLine;
            }).join('\n\n');

            console.log(
                '\n' + argStructure.help + '\n\n' +
                'OPTIONS:\n\n' + optsString + '\n');

            return null;
        }

        const outArgs = /** @type {ObjectMap<boolean|string>} */({ });

        for(const arg of argSpecs) {
            const value = args[arg.name]
                || args[arg.shortName]
                || (arg.share ? pipedInput : '');
            const valueFuzzed = getFuzzedString(string(value));

            if (arg.type === 'enum') {
                const choices = arg.choices.map(({ title, code }) => ({
                    fuzzed: getFuzzedString(code), title, code
                }));

                const exactMatch = choices.find(({ fuzzed }) =>
                    fuzzed === valueFuzzed);

                const fuzzyMatches = choices.filter(({ fuzzed }) =>
                    fuzzed.startsWith(valueFuzzed));

                outArgs[arg.name] =
                    exactMatch ? exactMatch.code :
                    fuzzyMatches.length === 1 ? fuzzyMatches[0].code :
                    fuzzyMatches.length > 1;

            } else {
                outArgs[arg.name] = value;
            }
        }
        return outArgs;
    },

    /**
     * Compiles an HTML file at a given path and displays the result.
     * @param {string} appPath the path to the directory to compile
     */
    compile: async (appPath) => {
        appPath = resolvePath(appPath);

        const html = await readFile(path.join(appPath, 'index.html')) || '';

        const replacedHtml = html.replace(/<(script|link)[^>]*>/g, tag => {
            const srcMatch  = tag.match(srcRegex);
            const hrefMatch = tag.match(hrefRegex);
            const src  = srcMatch  && srcMatch[1];
            const href = hrefMatch && hrefMatch[1];
            const isStyle = relRegex.test(tag);
            if (src) {
                let resText = 'null';
                const pathSrc = path.join(appPath, src);
                try { resText = fs.readFileSync(pathSrc).toString(); }
                catch(e) { }
                return tag.replace(srcRegex, `data-name="${src}"`) + '\n' +
                    resText + '\n';
            }
            if (isStyle && href) {
                let resText = '/* CSS FILE NOT FOUND */';
                const pathHref = path.join(appPath, href);
                try { resText = fs.readFileSync(pathHref).toString(); }
                catch(e) { }
                return '<style>\n' + resText + '\n</style>';
            }
            return tag;
        });

        fs.writeFileSync(tmpPath, replacedHtml);
        proc.spawnSync('open', [ tmpPath ]);
    },

    /**
     * Displays some HTML to the user.
     * @param {string} html the html to show
     */
    showHtml: async (html) => {
        fs.writeFileSync(tmpPath, html);
        proc.spawnSync('open', [ tmpPath ]);
    },

    /**
     * Downloads some text from a given URL and returns the result.
     * @param {string} url the URL to download JSON from
     * @return {Promise<string>} downloaded string, or null if invalid
     */
    downloadText: async (url) => await sendRequest(url),

    /**
     * Downloads JSON from a given URL and returns the result.
     * @param {string} url the URL to download the JSON from
     * @return {Promise<Object|null>} downloaded JSON or null if invalid
     */
    downloadJson: async (url) => jsonParse(await sendRequest(url)),

    /**
     * Downloads a file from a URL and stores it at the given filePath.
     * @param {string} url the URL to download from
     * @param {string} filePath the local path to store the file
     * @return {Promise<number>} resolves to the status code for the request
     */
    downloadFile: async (url, filePath) => new Promise(yes => {
        const get = url.startsWith('https') ? https.get : http.get;
        get(url, response => {
            const statusCode = (response.statusCode) || 0;
            if (statusCode === 200) {
                const stream = fs.createWriteStream(resolvePath(filePath));
                response.pipe(stream).on('close', () => yes(statusCode));
            } else {
                yes(statusCode);
            }
        });
    }),

    /**
     * POSTs some form data to a given URL.
     * @param {string} url the url to upload the form to
     * @param {ObjectMap<string>} form the form data to submit
     * @return {Promise<string>} a promise resolving with the response body
     */
    uploadForm: async (url, form) => {
        const formEncoded = querystring.stringify(form);
        const headers = {
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'Content-Length': formEncoded.length.toString()
        };
        return await sendRequest(url, 'POST', headers, formEncoded);
    },

    /**
     * Sends a generic request, returning the response string.
     * @param {string} url the URL to send the request to
     * @param {ObjectMap<string>} [headers] the map of header data to send
     * @param {string} [body] the body string data to send
     * @param {'GET'|'POST'|'PUT'} [method='POST'] the HTTP method to use
     * @return {Promise<string>} a promise resolving to the response body
     */
    sendRequest: async (url, headers, body, method) => {
        return await sendRequest(url, method ?? 'POST', headers, body);
    },

    /**
     * POSTs a file with a multipart form to a given URL.
     * @param {string} url the url to upload the data to
     * @param {ObjectMap<string>} options any extra parameters to add to body
     * @param {string} filePath the path to the file to upload
     * @return {Promise<string>} a promise resolving with the response body
     */
    uploadFile: async (url, options, filePath) => {
        const method = 'POST';
        const filePathAbsolute = resolvePath(filePath);
        const fileName = path.basename(filePathAbsolute);
        const buffer = await readFileBuffer(filePathAbsolute);
        const randString = Math.random().toString().substring(2, 18);
        const boundary = '----NodeFormBoundary' + randString;
        const headers = {
            'Content-Type': 'multipart/form-data; boundary=' + boundary
        };

        let data = '';
        for(const key in options) {
            data += '--' + boundary + '\r\n'
                + 'Content-Disposition: form-data; name="' + key + '"; \r\n\r\n'
                + options[key] + '\r\n';
        }

        data += '--' + boundary + '\r\n'
            + 'Content-Disposition: form-data; name="files[]"; '
            + 'filename="' + fileName + '"\r\n'
            + 'Content-Type: application/octet-stream\r\n\r\n';

        const body = Buffer.concat([
            Buffer.from(data, 'utf8'),
            buffer || Buffer.from([]),
            Buffer.from('\r\n--' + boundary + '--\r\n', 'utf8'),
        ]);

        return await sendRequest(url, method, headers, body);
    },

    /**
     * Reads a text file at a given path and returns the result.
     * @param {string} textPath the file path to the text file
     * @return {Promise<string|null>} resolves to the text content
     */
    readText: async (textPath) => await readFile(textPath),

    /**
     * Reads a JSON file at a given path and returns the result.
     * @param {string} jsonPath the file path to the JSON file
     * @return {Promise<Object|null>} resolves to the object or null if invalid
     */
    readJson: async (jsonPath) => jsonParse(await readFile(jsonPath), true),
    
    /**
     * Reads a binary file at a given path and returns the result.
     * @param {string} bytesPath the file path to the binary file
     * @return {Promise<Uint8Array|null>} resolves to the content bytes
     */
    readBytes: async (bytesPath) => {
        const buffer = await readFileBuffer(bytesPath);
        return buffer ? new Uint8Array(buffer) : null;
    },

    /**
     * Writes a string to a text file.
     * @param {string} textPath the file path to the text file to write
     * @param {string} text the text to write
     * @return {Promise<void>} a promise resolving after the file is written
     */
    writeText: (textPath, text) => writeData(textPath, text),

    /**
     * Writes an object to a JSON file.
     * @param {string} jsonPath the file path to the JSON file to write
     * @param {Object} json the JSON object to write
     * @return {Promise<void>} a promise resolving after the file is written
     */
    writeJson: (jsonPath, json) =>
        writeData(jsonPath, JSON.stringify(json, null, '  ')),

    /**
     * Writes an array of bytes to a file at a particular path.
     * @param {string} bytesPath the file path to the binary file to write
     * @param {number[]|Uint8Array} bytes the list of bytes to write
     * @return {Promise<void>} a promise resolving after the file is written
     */
    writeBytes: (bytesPath, bytes) => 
        new Promise(yes => {
            fs.writeFile(
                resolvePath(bytesPath),
                Array.isArray(bytes) ? Buffer.from(bytes) : Buffer.from(bytes),
                () => yes()
            );
        }),

    /**
     * Saves an argument structure object to the argument cache.
     * @param {ArgStructure} argStructure the argument structure to write
     * @return {Promise<void>} a promise resolving after the file is written
     */
    cacheArgStructure: cacheArgStructure,

    /**
     * Lists the files within a particular directory.
     * @param {string} folderPath the path whose children this lists
     * @return {Promise<string[]>} a promise resolving with the list of names
     */
    listFiles: folderPath => new Promise(
        (yes) => fs.readdir(
            resolvePath(folderPath),
            (error, result) => yes(error ? [ ] : result || [ ])
        )
    ),

    /**
     * Gets whether or not a path is a file that exists.
     * @param {string} filePath the path to the potential file
     * @return {Promise<boolean>} true if the path is an existing file
     */
    isFile: filePath =>
        new Promise(yes =>
            fs.stat(
                resolvePath(filePath),
                (error, stat) => yes(error || !stat ? false : stat.isFile())
            )
        ),

    /**
     * Gets whether or not a given path is a directory
     * @param {string} folderPath the path to the file or folder
     * @return {Promise<boolean>} true if a folder is at `folderPath`
     */
    isDirectory: folderPath =>
        new Promise(yes =>
            fs.stat(
                resolvePath(folderPath),
                (err, stat) => yes(err || !stat ? false : stat.isDirectory())
            )
        ),

    /**
     * Gets the size of a file in kilobytes (floored).
     * @param {string} filePath the path to the file whose size we get
     * @return {Promise<number>} the size of the file, in kilobytes
     */
    getFileSize: filePath =>
        new Promise(yes =>
            fs.stat(
                resolvePath(filePath),
                (e, stat) => yes(e || !stat ? 0 : Math.floor(stat.size / 1024))
            )
        ),

    /**
     * Gets the last modified date of a particular file.
     * @param {string} filePath the path to the file whose date we get
     * @return {Promise<Date|null>} this file's last-modified date
     */
    getFileModificationDate: filePath =>
        new Promise(yes =>
            fs.stat(
                resolvePath(filePath),
                (e, stat) => yes(e || !stat ? null : stat.mtime)
            )
        ),

    /**
     * Creates a folder at a given path.
     * @param {string} folderPath the path to the folder to create
     * @return {Promise<boolean>} true if the folder was created
     */
    makeDirectory: folderPath =>
        new Promise(yes => fs.mkdir(folderPath, error => yes(!error))),

    /**
     * Moves a file from one path to another.
     * @param {string} sourcePath the path to read a file from
     * @param {string} destinationPath the path to move the file to
     * @return {Promise<boolean>} resolves to true when move is successful
     */
    moveFile: (sourcePath, destinationPath) =>
        new Promise(yes =>
            fs.rename(
                resolvePath(sourcePath),
                resolvePath(destinationPath),
                error => yes(!!error)
            )
        ),

    /**
     * Copies a file from one path to another.
     * @param {string} sourcePath the path to read a file from
     * @param {string} destinationPath the path to copy the file to
     * @return {Promise<boolean>} resolves to true when copy is successful
     */
    copyFile: (sourcePath, destinationPath) => 
        new Promise(yes =>
            fs.copyFile(
                resolvePath(sourcePath),
                resolvePath(destinationPath),
                error => yes(!!error)
            )
        ),

    /**
     * Opens a given URL in safari or the program handling the given protocol.
     * @param {string} url the url to open
     */
    open: url => { proc.spawnSync('open', [ url ]); },

    /**
     * Prints a transient info status message.
     * @param {string} msg the message. Should not be important.
     */
    status: (msg) => {
        const canReturn = Boolean(process.stdout.cursorTo);
        process.stdout.write(msg + (canReturn ? space : '\n'));
        if (canReturn) { process.stdout.cursorTo(0); }
    },

    /**
     * Prints a permanent informational log message.
     * @param {string} msg the message to log until the end of the app
     */
    log: (msg) => { console.log(msg); },

    /**
     * Prints the final output of the program.
     * @param {string|null} title a string describing the final output
     * @param {string|number|boolean} data the easy-to-copy final output
     */
    output: (title, data) => {
        console.log(data + (outputType === 'data' ? '' : space));
        title;
    },

    /**
     * Shows an error message.
     * @param {string} title the title of the script that threw
     * @param {string|number|boolean} data the easy-to-copy final output string
     */
    error: (title, data) => { console.error(`[ERROR ${title}]: ${data}`); },

    /**
     * Puts a string onto the clipboard.
     * @param {string} data the string to put onto the clipboard
     */
    copy: (data) => {
        const copy = proc.spawn('pbcopy');
        copy.stdin.write(data);
        copy.stdin.end();
    },

    /**
     * Gets the data that's on the clipboard
     * @return {string} the data that was on the clipboard
     */
    paste: () => proc.spawnSync('pbpaste').output[1]?.toString() ?? '',

    /**
     * A collection of useful third-party libraries.
     * See lib/external/entry.js.
     */
    external: external
};
