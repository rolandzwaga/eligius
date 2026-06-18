import {resolve} from 'node:path';
import alias from '@rollup/plugin-alias';
import {defineConfig} from 'tsdown';

const srcDir = resolve(import.meta.dirname, 'src');

const aliasPlugin = alias({
  entries: [
    {find: /^@\/(.*)/, replacement: `${srcDir}/$1`},
    {find: /^@action\/(.*)/, replacement: `${srcDir}/action/$1`},
    {
      find: /^@configuration\/(.*)/,
      replacement: `${srcDir}/configuration/$1`,
    },
    {find: /^@controllers\/(.*)/, replacement: `${srcDir}/controllers/$1`},
    {find: /^@diagnostics\/(.*)/, replacement: `${srcDir}/diagnostics/$1`},
    {find: /^@eventbus\/(.*)/, replacement: `${srcDir}/eventbus/$1`},
    {find: /^@importer\/(.*)/, replacement: `${srcDir}/importer/$1`},
    {find: /^@operation\/(.*)/, replacement: `${srcDir}/operation/$1`},
    {
      find: /^@timelineproviders\/(.*)/,
      replacement: `${srcDir}/timelineproviders/$1`,
    },
    {find: /^@util\/(.*)/, replacement: `${srcDir}/util/$1`},
    {find: /^@test\/(.*)/, replacement: `${srcDir}/test/$1`},
  ],
}) as any;

const base = {
  external: ['lottie-web', 'jquery', 'video.js'],
  format: ['esm'] as const,
  platform: 'node' as const,
  sourcemap: true,
  minify: false,
  target: 'es2022',
  outDir: './dist',
  plugins: [aliasPlugin],
};

// Two INDEPENDENT builds (the `build` npm script `rimraf`s dist first, so neither
// needs `clean`). They are intentionally separate so the metadata entry gets its
// OWN bundle and can never share a rolldown chunk with the engine: a single
// multi-entry build co-locates the metadata namespaces with the operation /
// controller implementations (which import jquery@4), which would defeat the
// whole point of `eligius/metadata`. The metadata graph only `import { type … }`s
// the operation-data interfaces (erased via verbatimModuleSyntax), so its
// standalone bundle is free of jquery / lottie-web / video.js and imports cleanly
// in a DOM-less Node context. The package.json `exports` map is maintained by
// hand (no `exports: true`) so the two builds don't fight over it.
export default defineConfig([
  {...base, entry: ['./src/index.ts']},
  {...base, entry: ['./src/metadata.ts']},
]);
