import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import json from '@rollup/plugin-json';

/** @type {import('rollup').RollupOptions} */
export default {
    input: './entry.js',
    plugins: [commonjs(), resolve(), json()]
};
