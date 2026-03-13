// Adds extension/node_modules to Node's search path so js-yaml resolves
// when running test-orchestration.js directly from the repo root.
const path = require('path');
const Module = require('module');
const extra = path.join(__dirname, '..', 'extension', 'node_modules');
const current = process.env.NODE_PATH || '';
process.env.NODE_PATH = current ? `${current}${path.delimiter}${extra}` : extra;
Module._initPaths();
