// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: light-brown; icon-glyph: copy;
// share-sheet-inputs: plain-text, url;
// @ts-ignore
// eslint-disable-next-line
try { require; } catch(e) { require = () => importModule('lib/scriptable'); }

const {
    string, getInput, readText, writeText, markdownToHtml, markedHtml, output,
    listFiles, pathJoin
} = require('./lib/node.js');

const main = async () => {
    const input = await getInput({
        help: 'Converts all MD files in a folder into HTML files.',
        inScriptable: true,
        args: [{
            name: 'folder',
            shortName: 'f',
            type: 'pathFolder',
            bookmarkName: 'markdown-folder',
            help: 'The folder containing markdown files to convert.'
        }]
    });
    if (!input) { return; }

    const pathRoot = string(input.folder);
    const files = await listFiles(pathRoot);
    const mdFiles = files.filter(name => name.endsWith('.md'));

    for(const mdFile of mdFiles) {
        const inPath = pathJoin(pathRoot, mdFile);
        const outPath = pathJoin(pathRoot, mdFile.replace(/\.md$/, '.html'));
        const markdown = (await readText(inPath)) || '';
        await writeText(outPath, markedHtml(markdownToHtml(markdown)));
    }

    output('Markdown Folder', `Compiled ${mdFiles.length} files.`);
};

main();
