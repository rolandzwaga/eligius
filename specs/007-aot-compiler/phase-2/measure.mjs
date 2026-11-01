// Phase 2 bundle measurement.
//
// Installs the built package (package.json + dist/) into a throwaway consumer
// directory, so that package.json `exports` and `sideEffects` apply exactly as
// they do for a real consumer, then bundles three decks with three bundlers:
//
//   decks:    resource-importer   JSON config + EligiusResourceImporter from 'eligius'   (Phase 0 baseline)
//             create-main         JSON config + createImporter from 'eligius'
//             create-runtime      JSON config + createImporter from 'eligius/runtime'
//   bundlers: rolldown (Vite 8), esbuild, webpack (production, terser)
//
// jQuery and lottie-web are external in every build. Sizes are the JavaScript
// output, minified, and gzipped at level 9.
//
// Usage (after `npm run build`):
//   node specs/007-aot-compiler/phase-2/measure.mjs <bundlers-dir> [sideEffects]
//
// <bundlers-dir> is a directory with esbuild and webpack installed in its
// node_modules. The optional second argument overrides the `sideEffects` field
// of the installed package.json: `none` deletes it, `false` sets it to false.

import {spawnSync} from 'node:child_process';
import {cpSync, mkdirSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {gzipSync} from 'node:zlib';
import {build as viteBuild} from '../../../node_modules/vite/dist/node/index.js';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..', '..', '..');
const bundlersDir = process.argv[2];
const sideEffectsOverride = process.argv[3];
if (!bundlersDir) {
  console.error('usage: node measure.mjs <bundlers-dir> [none|false]');
  process.exit(1);
}
const bundlersRequire = createRequire(
  join(resolve(bundlersDir), 'package.json')
);
const esbuild = bundlersRequire('esbuild');
const webpack = bundlersRequire('webpack');

const consumer = join(here, 'consumer');
rmSync(consumer, {recursive: true, force: true});
mkdirSync(join(consumer, 'node_modules', 'eligius'), {recursive: true});

const pkg = JSON.parse(readFileSync(join(repoRoot, 'package.json'), 'utf8'));
if (sideEffectsOverride === 'none') {
  delete pkg.sideEffects;
} else if (sideEffectsOverride === 'false') {
  pkg.sideEffects = false;
}
writeFileSync(
  join(consumer, 'node_modules', 'eligius', 'package.json'),
  JSON.stringify(pkg, null, 2)
);
cpSync(
  join(repoRoot, 'dist'),
  join(consumer, 'node_modules', 'eligius', 'dist'),
  {
    recursive: true,
    filter: source => !source.endsWith('.map'),
  }
);
// Bundled runtime dependencies of eligius are inlined into dist, but a
// consumer resolves jquery as external, so nothing else is needed.
cpSync(
  join(here, '..', 'phase-0', 'sample-config.js'),
  join(consumer, 'sample-config.js')
);

const NAMED = `
  addClass,
  DomContainerProvider,
  EngineFactory,
  endForEach,
  endWhen,
  forEach,
  otherwise,
  RafPositionSource,
  removeClass,
  SimplePlaylist,
  selectElement,
  setData,
  setElementContent,
  setOperationData,
  when,
`;

const decks = {
  'resource-importer': `
import {EligiusResourceImporter, EngineFactory} from 'eligius';
import {sampleConfig} from './sample-config.js';

const engineFactory = new EngineFactory(new EligiusResourceImporter(), window);
const {engine} = engineFactory.createEngine(sampleConfig);
engine.init().then(() => engine.start());
`,
  'create-main': `
import {createImporter, ${NAMED}} from 'eligius';
import {sampleConfig} from './sample-config.js';

const importer = createImporter({
  operations: {addClass, endForEach, endWhen, forEach, otherwise, removeClass, selectElement, setData, setElementContent, setOperationData, when},
  providers: {DomContainerProvider, RafPositionSource, SimplePlaylist},
});
const engineFactory = new EngineFactory(importer, window);
const {engine} = engineFactory.createEngine(sampleConfig);
engine.init().then(() => engine.start());
`,
  'create-runtime': `
import {createImporter, ${NAMED}} from 'eligius/runtime';
import {sampleConfig} from './sample-config.js';

const importer = createImporter({
  operations: {addClass, endForEach, endWhen, forEach, otherwise, removeClass, selectElement, setData, setElementContent, setOperationData, when},
  providers: {DomContainerProvider, RafPositionSource, SimplePlaylist},
});
const engineFactory = new EngineFactory(importer, window);
const {engine} = engineFactory.createEngine(sampleConfig);
engine.init().then(() => engine.start());
`,
  // Behaviour check, not a size row: the fluent API's ...ByType methods need the
  // operation registration that runs when 'eligius' loads. With sideEffects
  // declared, every bundler must still keep it when ConfigurationFactory is used.
  'fluent-bytype': `
import {ConfigurationFactory, selectElement} from 'eligius';

try {
  const factory = new ConfigurationFactory();
  factory.init('en-US').setContainerSelector('#app').addTimeline('main', 'animation', 10, false, '#t');
  factory
    .createTimelineAction('main', 'A')
    .addDuration(0, 1)
    .addStartOperationByType(selectElement, {selector: '#a'})
    .next()
    .end();
  globalThis.__eligiusResult = factory.getConfiguration().timelines[0].timelineActions[0].startOperations.map(o => o.systemName);
} catch (error) {
  globalThis.__eligiusResult = {error: error.message};
}
`,
};
for (const [name, source] of Object.entries(decks)) {
  writeFileSync(join(consumer, `${name}.js`), source.trimStart());
}
writeFileSync(
  join(consumer, 'package.json'),
  JSON.stringify({name: 'consumer', private: true, type: 'module'})
);

const EXTERNAL = ['jquery', 'lottie-web'];

async function withRolldown(entry) {
  const out = await viteBuild({
    configFile: false,
    root: consumer,
    logLevel: 'warn',
    build: {
      write: false,
      minify: true,
      target: 'es2022',
      reportCompressedSize: false,
      rolldownOptions: {
        input: join(consumer, `${entry}.js`),
        external: EXTERNAL,
      },
    },
  });
  return out.output
    .filter(o => o.type === 'chunk')
    .map(c => c.code)
    .join('\n');
}

async function withEsbuild(entry) {
  const result = await esbuild.build({
    entryPoints: [join(consumer, `${entry}.js`)],
    bundle: true,
    minify: true,
    format: 'esm',
    target: 'es2022',
    platform: 'browser',
    external: EXTERNAL,
    write: false,
    logLevel: 'warning',
  });
  return result.outputFiles.map(f => f.text).join('\n');
}

function withWebpack(entry) {
  const outDir = join(consumer, 'webpack-out');
  return new Promise((resolvePromise, reject) => {
    webpack(
      {
        mode: 'production',
        context: consumer,
        entry: join(consumer, `${entry}.js`),
        output: {
          path: outDir,
          filename: `${entry}.js`,
          module: true,
          library: {type: 'module'},
        },
        experiments: {outputModule: true},
        externals: Object.fromEntries(
          EXTERNAL.map(name => [name, `module ${name}`])
        ),
        externalsType: 'module',
        target: ['web', 'es2022'],
        devtool: false,
        stats: 'errors-only',
      },
      (error, stats) => {
        if (error) {
          reject(error);
          return;
        }
        if (stats.hasErrors()) {
          reject(new Error(stats.toString('errors-only')));
          return;
        }
        resolvePromise(readFileSync(join(outDir, `${entry}.js`), 'utf8'));
      }
    );
  });
}

const bundlers = {
  rolldown: withRolldown,
  esbuild: withEsbuild,
  webpack: withWebpack,
};
const rows = [];
const sizeDecks = Object.keys(decks).filter(deck => deck !== 'fluent-bytype');
for (const [bundler, run] of Object.entries(bundlers)) {
  for (const deck of sizeDecks) {
    const code = await run(deck);
    const row = {
      bundler,
      deck,
      sideEffects:
        pkg.sideEffects === undefined
          ? 'absent'
          : JSON.stringify(pkg.sideEffects),
      minBytes: Buffer.byteLength(code),
      gzipBytes: gzipSync(Buffer.from(code), {level: 9}).length,
      // Markers of code the sample deck never names
      keepsHttpDelete:
        /httpDelete|\/\/ src\/operation\/http-delete/.test(code) ||
        code.includes('DELETE'),
      keepsLottie: code.includes('lottie-web'),
      keepsRegisterOperationTypes:
        code.includes('registerOperationTypes') ||
        /operationTypes\.set\(/.test(code),
    };
    rows.push(row);
    console.log(JSON.stringify(row));
  }
}
// Behaviour check of the fluent deck under every bundler
const checks = [];
for (const [bundler, run] of Object.entries(bundlers)) {
  const code = await run('fluent-bytype');
  const file = join(consumer, `fluent-${bundler}.mjs`);
  writeFileSync(file, code);
  const result = spawnSync(
    process.execPath,
    [join(here, 'run-in-jsdom.mjs'), file],
    {encoding: 'utf8'}
  );
  const check = {
    bundler,
    sideEffects: rows[0].sideEffects,
    byType: (result.stdout || result.stderr).trim().slice(0, 300),
  };
  checks.push(check);
  console.log(JSON.stringify(check));
}
const suffix = pkg.sideEffects === undefined ? 'no-sideeffects' : 'sideeffects';
writeFileSync(
  join(here, `sizes-${suffix}.result.json`),
  JSON.stringify({rows, checks}, null, 1)
);
rmSync(consumer, {recursive: true, force: true});
