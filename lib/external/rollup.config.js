import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';

/** @type {import('rollup').RollupOptions} */
export default { input: './entry.js', plugins: [commonjs(), resolve()] };
