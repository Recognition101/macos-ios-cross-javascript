/**
 * @typedef {import("./external/external.cjs").parse5.Document} Document
 * @typedef {import("./external/external.cjs").parse5.ChildNode} ChildNode
 * @typedef {import("./external/external.cjs").parse5.Element} Element
 */

/**
 * Given a Parse5 node, select an element whose attributes match test functions.
 * @typedef {(value: string|undefined) => boolean} Predicate
 * @param {Document|ChildNode|null} el the node to get the content from
 * @param {ObjectMap<Predicate|string>} constraints select all nodes that
 *      return `true` for each of these attributes.
 * @param {Element[]} [matched] the elements that matched the constraints
 * @return {Element[]} the elements that matched the constraints
 */
const select = (el, constraints, matched = [ ]) => {
    if (el && 'attrs' in el) {
        const isMatch = Object.entries(constraints).every(([name, test]) => {
            const attribute = el.attrs.find(x => x.name === name);
            const value = name === 'tagName' ? el.tagName : attribute?.value;
            return typeof test === 'string' ? test === value : test(value);
        });
        if (isMatch) {
            matched.push(el);
        }
    }

    if (el && 'childNodes' in el) {
        const children = el.childNodes ?? [];
        for(const child of children) {
            select(child, constraints, matched);
        }
    }

    return matched;
};

/**
 * Given a Parse5 node, gets the text content viewable by a user.
 * @param {Document|ChildNode|null|undefined} el the node to compile the text of
 * @return {string} the text content
 */
const getTextContent = el => {
    const isComment = el && (el.nodeName === '#comment' || 'data' in el);
    const isText = el && 'value' in el;
    const isLine = el && el.nodeName === 'br';
    if (isText || isLine || isComment || !el) {
        return isText ? el.value : (isLine ? '\n' : '');
    }

    let childText = '';
    const children = el.childNodes ?? [];
    for(const child of children) {
        childText += getTextContent(child);
    }
    return childText;
};

module.exports = { select, getTextContent };
