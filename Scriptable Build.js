// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: light-brown; icon-glyph: laptop;
/// <reference path="./types/build.d.ts" />
// @ts-ignore
// eslint-disable-next-line
try { require; } catch(e) { require = importModule; }

const {
    getInput, listFiles, output, external,
    pathJoin, readText, writeText, readJson, error
} = require('./lib/lib.js');

const pathFolder = '$/';
const pathReadme = '$/README.md';
const readmeBlockList = new Set([
    'Cafe.js',
    'Extension.js',
    'Shuttle.js',
    'Test File.js',
    'Welcome to Scriptable.js'
]);

const pathApiAst = '$/lib/data/api-ast.json';
const pathApiMdTemplate = '$/lib/data/api-template.md';
const pathApiMd = '$/lib/api.md';

const defaultCategory = '8. Internal Utility';
/** @type {Object<string, string>} */
const scriptCategories = {
    'cyan': '1. View Internal Data',
    'deep-green': '2. Append/Edit Internal Data',
    'yellow': '3. Refresh Internal Data',
    'purple': '4. Interactive Script',
    'blue': '5. String Transformation',
    'light-brown': '6. File Manipulation',
    'deep-blue': '7. Location Transformation',
    'gray': defaultCategory
};

/**
 * @param {Build.JsDocAstTyped} node extract types from this node
 * @return {string} the type, converted into a human-readable string
 */
const getType = node => (node.type?.names ?? [])
    .join(' | ')
    .replace(/\.<\(?/g, '<')
    .replace(/\)>/g, '>');

/**
 * @param {Build.JsDocAstNode} node extract types from this node
 * @return {string} the type, converted into a human-readable string
 */
const getReturns = node =>
    (node.returns ?? []).map(x => getType(x)).join(' | ');

/**
 * @param {Build.JsDocAstNode} node extract types from this node
 * @return {string} the type, converted into a human-readable string
 */
const getDescription = node =>
    (node.description?.replace(/\n\n/g, '<br/><br/>') ?? '*No Description*');

const help = '' +
`Makes sure this project is up to date by:
    1. Updating README.md to list all scripts.
    2. Generating the ./lib/API.md file.

Setup: Create $/lib/node-ast.json on macOS by running:
    jsdoc -X ./lib/lib-node.js > ./lib/data/api-ast.json`;

const main = async () => {
    const name = 'Scriptable Build';
    const input = await getInput({ name, help, inScriptable: false });
    if (!input) { return; }

    // Read Files
    const apiMdText = await readText(pathApiMdTemplate);
    if (!apiMdText) {
        return error('Scriptable Build', `Read Error: ${pathApiMdTemplate}`);
    }
    const apiAstJson = await readJson(pathApiAst);
    const astNodes = /** @type {Build.JsDocAstNode[]|null} */(apiAstJson);
    if (!astNodes) {
        return error('Scriptable Build', `Read Error: ${pathApiAst}`);
    }

    // Build README
    const fileNames = await listFiles(pathFolder);
    const jsFileNames = fileNames.filter(f => f.endsWith('.js')).sort();
    const jsFiles = jsFileNames.map(name => ({ name, content: '' }));
    for(const jsFile of jsFiles) {
        const pathJs = pathJoin(pathFolder, jsFile.name);
        jsFile.content = (await readText(pathJs)) || '';
    }

    const jsInfo = jsFiles.map(({ name, content }) => {
        const isShare = /share['"]?: true/.test(content);
        const inReadme = !readmeBlockList.has(name);
        const colorMatch = content.match(/^\s*\/\/.*icon-color:\s*([\w-]+)/m);
        const color = colorMatch?.[1];
        const category = scriptCategories[color ?? 'gray'] || defaultCategory;
        const shareIcon = isShare ? '&#x238B; ' : '';
        const bullet = ` * ${shareIcon}${name.replace(/\.js\s*$/, '')}`;
        return { name, content, isShare, inReadme, bullet, category };
    });

    /** @type {Object<string, (typeof jsInfo[number])[]>} */
    const categories = {};
    for(const js of jsInfo) {
        categories[js.category] = categories[js.category] || [];
        categories[js.category].push(js);
    }

    const categoryPairs = Object.entries(categories);
    categoryPairs.sort((a, b) => a[0].localeCompare(b[0]));

    const scriptsList = categoryPairs.map(([category, jsInfo]) => {
        const scripts = jsInfo.filter(x => x.inReadme);
        scripts.sort((a, b) =>
            (a.isShare && !b.isShare) ? 1 :
            (!a.isShare && b.isShare) ? -1 :
            (a.name.localeCompare(b.name))
        );

        return `#### ${category}\n${scripts.map(x => x.bullet).join('\n')}`;
    }).join('\n\n');

    const readme =
        ((await readText(pathReadme)) || '')
            .replace(
                /### Scripts[\s\n]*(\s*((\*|####)[^\n]+)?\n)+/,
                `### Scripts\n\n${scriptsList}\n`
            );

    await writeText(pathReadme, readme);
    await writeText(
        pathReadme.replace(/\.md$/, '.html'),
        external.markedTemplates.html(external.marked(readme))
    );

    // Build ./lib/api.md
    let apiFunctions = '';

    for(const node of astNodes) {
        if (node.memberof === 'module.exports') {
            const params = node.params ?? [];
            const returns = node.returns ?? [];

            const isFunction = node.kind === 'function' || params.length > 0;
            const paramPairs = params.map(p => `${p.name}: ${getType(p)}`);
            const returnType = isFunction ? getReturns(node) : '';
            const returnSuffix = returnType ? ': ' + returnType : '';
            const signature = isFunction
                ? `\`${node.name}(${paramPairs.join(', ')})${returnSuffix}\``
                : `\`${getType(node)}\``;

            const paramTexts = params.map(p =>
                `    * \`${p.name}\` (type: \`${getType(p)}\`): ` +
                (getDescription(p))
            );
            const returnTexts = returns.map(p =>
                `    * (type: \`${getType(p)}\`): ${getDescription(p)}`
            );

            apiFunctions += `**${node.name}** ${signature}\n\n` +
                ('  * ' + (getDescription(node))) + '\n' +
                (params.length > 0
                    ? `  * *Arguments:*\n${paramTexts.join('\n')}\n`
                    : '') +
                (returns.length > 0
                    ? `  * *Returns:*\n${returnTexts.join('\n')}\n`
                    : '') +
                '\n';
        }
    }

    const fullApiMd = apiMdText.replace('{{FUNCTIONS}}', apiFunctions);
    await writeText(pathApiMd, fullApiMd);

    output('Scriptable Build', 'Build Complete.');
};

main();
