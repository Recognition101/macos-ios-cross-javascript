//@ts-ignore
//eslint-disable-next-line
try { require; } catch(e) { require = () => importModule('./lib-scriptable'); }
module.exports = require('./lib-node.js');
