// Evaluates a bundled deck in Node with a jsdom window, so that a bundle can be
// checked for behaviour, not only for size. Prints globalThis.__eligiusResult.
// Usage: node run-in-jsdom.mjs <bundle.mjs>
import {pathToFileURL} from 'node:url';
import {JSDOM} from 'jsdom';

const dom = new JSDOM(
  '<!doctype html><html><body><div id="app"></div></body></html>'
);
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.HTMLElement = dom.window.HTMLElement;
globalThis.Node = dom.window.Node;

await import(pathToFileURL(process.argv[2]).href);
console.log(JSON.stringify(globalThis.__eligiusResult));
