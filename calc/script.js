// Constants
window.e = Math.E;
window.pi = Math.PI;

// Multiple Argument Functions

/**
 * @template T the type of the array
 * @typedef {T|T[]} MaybeArray
 */

/** @type {<T>(obj: MaybeArray<T>) => T[]} */
const boxArray = obj => Array.isArray(obj) ? obj : [ obj ];

/** @type {(str: string|number) => number[]} */
const stringToNumbers = str =>
    typeof str === 'number'
        ? [ str ]
        : str.replace(/\$/g, '').match(/-?\d+(\.\d+)?/g).map(x => Number(x));

/** @type {(head: MaybeArray<string|number>, ...tail: number[]) => number[]} */
const Numbers = (...args) => {
    const [head, ...tail] = args;
    return boxArray(head).flatMap(x => stringToNumbers(x)).concat(tail);
};

/** @type {(head: MaybeArray<string|number>, ...tail: number[]) => number} */
const sum = (...args) => Numbers(...args).reduce((x, y) => x + y, 0);

/** @type {(head: MaybeArray<string|number>, ...tail: number[]) => number} */
const min = (...args) => Math.min(...Numbers(...args));

/** @type {(head: MaybeArray<string|number>, ...tail: number[]) => number} */
const max = (...args) => Math.max(...Numbers(...args));


window.Numbers = Numbers;
window.sum = sum;
window.max = max;
window.min = min;

// Single Argument Functions
window.abs = Math.abs.bind(Math);
window.ceil = Math.ceil.bind(Math);
window.floor = Math.floor.bind(Math);
window.round = Math.round.bind(Math);
window.sign = Math.sign.bind(Math);
window.random = Math.random.bind(Math);
window.pow = Math.pow.bind(Math);
window.sqrt = Math.sqrt.bind(Math);
window.log = Math.log.bind(Math);
window.log2 = Math.log2.bind(Math);
window.log10 = Math.log10.bind(Math);


// Trig Functions (Single Argument)
window.acos = Math.acos.bind(Math);
window.acosh = Math.acosh.bind(Math);
window.asin = Math.asin.bind(Math);
window.asinh = Math.asinh.bind(Math);
window.atan = Math.atan.bind(Math);
window.atanh = Math.atanh.bind(Math);
window.atan2 = Math.atan2.bind(Math);
window.cos = Math.cos.bind(Math);
window.cosh = Math.cosh.bind(Math);
window.sin = Math.sin.bind(Math);
window.sinh = Math.sinh.bind(Math);
window.tan = Math.tan.bind(Math);
window.tanh = Math.tanh.bind(Math);


/**
 * Creates an HTML element with a given set of attributes and children
 * @typedef {Element|string} Child a DOM child to be appended to a new element
 * @param {string} tag the HTML tag name to create
 * @param {{[name: string]: string|undefined}} attrs the attributes to add
 * @param {Child[]|Child} children any children to add
 * @return {Element} the created element
 */
const h = (tag, attrs, children=[]) => {
    const tagData = Array.from(tag.match(/(^|[#.])[^#.]*/g) || []);
    const el = document.createElement(tagData.shift() || 'div');
    tagData.forEach(str =>
        str[0] === '.' ? el.classList.add(str.substr(1)) :
        str[0] === '#' ? el.setAttribute('id', str.substr(1)) : '');

    Object.keys(attrs).forEach(key => /** @type {any} */(el)[key] = attrs[key]);

    const kids = children instanceof Array ? children : [ children ];
    kids.forEach(kid => el.appendChild(
        typeof kid === 'string' ? document.createTextNode(kid) : kid));

    return el;
};

const gEval = eval;

/**
 * Removes formatting such as smart quotes.
 * @param {string} input the given input
 * @return {string} the cleaned input
 */
const fixInput = input => input
    .replace(/\u201c|\u201d/g, '"')
    .replace(/\u2018|\u2019/g, '\'');


const main = () => {
    /** @type {HTMLInputElement|null} */
    const domInput = document.getElementById('input');

    /** @type {HTMLUListElement|null} */
    const domResults = document.getElementById('results');

    /** @type {HTMLDivElement|null} */
    const domError = document.getElementById('error');

    /** @type {HTMLUListElement|null} */
    const domOps = document.getElementById('operations');

    const results = [];

    if (domInput && domResults && domError) {
        domInput.addEventListener('keyup', ev => {
            const target = /** @type {HTMLInputElement|null} */(ev.target);
            if (target && ev.code === 'Enter') {
                domError.classList.remove('error-visible');

                try {
                    const input = fixInput(target.value);
                    const value = gEval(input);
                    const valueString = JSON.stringify(value) || ('' + value);
                    const key = '$' + (results.length + 1);
                    results.push(value);
                    window[key] = value;
                    target.value = '';

                    const domResult = h('li.result', {}, [
                        h('div.result-key', {}, key + ' ='),
                        h('div.result-value', {}, valueString),
                        h('div.result-input', {}, input)
                    ]);

                    domResults.insertBefore(domResult, domResults.children[0]);
                } catch(e) {
                    domError.classList.add('error-visible');
                    domError.innerText = '' + e;
                }
            }
        });

        document.addEventListener('DOMContentLoaded', () => domInput.focus());
    }

    if (domInput && domOps) {
        domOps.addEventListener('click', ev => {
            const target = /** @type {HTMLElement|null} */(ev.target);
            const domLi = target && target.closest('li');
            if (target && domLi) {
                const isConstant = domLi.classList.contains('constant');
                const op = target.innerText + (isConstant ? '' : '(');
                const input = domInput.value;
                const newSelection = domInput.selectionStart + op.length;
                domInput.value = input.slice(0, domInput.selectionStart) +
                    op + input.slice(domInput.selectionEnd);
                domInput.selectionStart = newSelection;
                domInput.selectionEnd = newSelection;
            }
        });
    }
};

main();
