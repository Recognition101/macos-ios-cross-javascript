// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: light-brown; icon-glyph: laptop;
// share-sheet-inputs: plain-text, url;
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
    'Extension.js',
    'Test File.js',
    'Welcome to Scriptable.js'
]);

const pathApiAst = '$/lib/data/api-ast.json';
const pathApiMdTemplate = '$/lib/data/api-template.md';
const pathApiMd = '$/lib/api.md';

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
        const bullet = ` * ${name.replace(/\.js\s*$/, '')}`;
        return { name, content, isShare, inReadme, bullet };
    });

    const jsInfoScripts = jsInfo.filter(x => x.inReadme && !x.isShare);
    const jsInfoShares = jsInfo.filter(x => x.inReadme && x.isShare);
    const scriptsList = jsInfoScripts.map(x => x.bullet).join('\n');
    const sharesList = jsInfoShares.map(x => x.bullet).join('\n');

    const readme =
        ((await readText(pathReadme)) || '')
            .replace(
                /### Scripts[\s\n]*(\s+\*[^\n]+\n)+/,
                `### Scripts\n\n${scriptsList}\n`
            )
            .replace(
                /### Share[\s\n]*(\s+\*[^\n]+\n)+/,
                `### Share\n\n${sharesList}\n`
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
