import {copyFileSync, readFileSync, writeFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {gzipSync} from 'node:zlib';
import {build} from '../../../node_modules/vite/dist/node/index.js';

const here = dirname(fileURLToPath(import.meta.url));
const DIST = join(here, '..', '..', '..', 'dist', 'index.mjs');
const dts = readFileSync(
  join(here, '..', '..', '..', 'dist', 'index.d.mts'),
  'utf8'
);
for (const name of [
  'addClass',
  'DomContainerProvider',
  'EligiusEngine',
  'endForEach',
  'endWhen',
  'EngineFactory',
  'forEach',
  'otherwise',
  'RafPositionSource',
  'removeClass',
  'selectElement',
  'setData',
  'setElementContent',
  'setOperationData',
  'SimplePlaylist',
  'when',
  'Action',
]) {
  if (!new RegExp(`\\b${name}\\b`).test(dts))
    console.log('MISSING EXPORT', name);
}

copyFileSync(join(here, 'eligian', 'tour.json'), join(here, 'tour.json'));
copyFileSync(join(here, 'eligian', 'tour.css'), join(here, 'tour.css'));

const sizes = [];
async function measure(entry, bundleJquery) {
  const out = await build({
    configFile: false,
    root: here,
    logLevel: 'warn',
    resolve: {alias: {eligius: DIST}},
    build: {
      write: false,
      minify: true,
      target: 'es2022',
      reportCompressedSize: false,
      rolldownOptions: {
        input: join(here, `${entry}.js`),
        external: bundleJquery ? ['lottie-web'] : ['jquery', 'lottie-web'],
      },
    },
  });
  const chunks = out.output.filter(o => o.type === 'chunk');
  const code = chunks.map(c => c.code).join('\n');
  const row = {
    entry,
    jquery: bundleJquery ? 'bundled' : 'external',
    chunks: chunks.length,
    minBytes: Buffer.byteLength(code),
    gzipBytes: gzipSync(Buffer.from(code), {level: 9}).length,
  };
  sizes.push(row);
  console.log(JSON.stringify(row));
}
for (const entry of ['deck-full', 'deck-json-full', 'deck-minimal']) {
  await measure(entry, false);
  await measure(entry, true);
}
writeFileSync(join(here, 'sizes.json'), JSON.stringify(sizes, null, 1));

// Profile pages: one multi-page build with jQuery bundled, served from out/
await build({
  configFile: false,
  root: here,
  logLevel: 'warn',
  base: './',
  resolve: {alias: {eligius: DIST}},
  build: {
    outDir: join(here, 'out'),
    emptyOutDir: true,
    minify: false,
    target: 'es2022',
    sourcemap: true,
    rolldownOptions: {
      input: {tour: join(here, 'tour.html'), sample: join(here, 'sample.html')},
      external: ['lottie-web'],
    },
  },
});
console.log('profile pages built into out/');
