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
    {find: /^@eventbus\/(.*)/, replacement: `${srcDir}/eventbus/$1`},
    {find: /^@importer\/(.*)/, replacement: `${srcDir}/importer/$1`},
    {find: /^@lint\/(.*)/, replacement: `${srcDir}/lint/$1`},
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
  external: ['lottie-web', 'jquery'],
  format: ['esm'] as const,
  platform: 'node' as const,
  sourcemap: true,
  minify: false,
  target: 'es2022',
  outDir: './dist',
  plugins: [aliasPlugin],
};

// Four INDEPENDENT builds: index+runtime, metadata, configuration-api and lint (the
// `build` npm script `rimraf`s dist first, so none of them needs `clean`). They are intentionally separate so the metadata entry gets its
// OWN bundle and can never share a rolldown chunk with the engine: a single
// multi-entry build co-locates the metadata namespaces with the operation /
// controller implementations (which import jquery@4), which would defeat the
// whole point of `eligius/metadata`. The metadata graph only `import { type … }`s
// the operation-data interfaces (erased via verbatimModuleSyntax), so its
// standalone bundle is free of jquery / lottie-web and imports cleanly
// in a DOM-less Node context. The package.json `exports` map is maintained by
// hand (no `exports: true`) so the builds don't fight over it.
//
// `lint` is a DOM-free entry for the configuration linter. It imports the real
// ConfigurationResolver and the action classes, whose import graph must stay
// free of jquery (src/test/unit/lint/node-environment.spec.ts guards that), and
// the generated metadata, never the operation implementations.
//
// `configuration-api` is a DOM-free entry for the fluent ConfigurationFactory, for
// build tools that run in Node. It is its own build for the same reason as
// `metadata`: it validates operation names against the metadata and must not
// share a chunk with the operation implementations.
//
// Declaration files. The source uses the global `JQuery` type from
// @types/jquery, which consumers of the published declarations may not have:
// - The main entry needs jQuery at runtime anyway, so its declarations
//   reference @types/jquery explicitly (an optional peer dependency).
// - The DOM-free entries must type-check without jquery or @types/jquery, so
//   their declarations get a module-scoped, structural `JQuery` that shadows
//   the global one. It is not exported, so it neither leaks into nor conflicts
//   with a consumer's own @types/jquery, and a real jQuery object is assignable
//   to it.
// lottie-web types never reach the declarations: the public API uses the
// structural types in src/controllers/types.ts.
// `npm run check:types` type-checks all three entries in consumer projects.
const mainDtsBanner = '/// <reference types="jquery" />';

const domFreeDtsBanner = `/**
 * Structural stand-in for jQuery's \`JQuery\` type, so these declarations do not
 * depend on @types/jquery. Module scoped: it shadows the global \`JQuery\` only
 * inside this file.
 */
interface JQuery<TElement = HTMLElement> extends Iterable<TElement> {
  readonly jquery: string;
  readonly length: number;
  [index: number]: TElement;
}
declare namespace JQuery {
  type Duration = number | 'fast' | 'slow';
  type Node = Element | Text | Comment | Document | DocumentFragment;
}`;

export default defineConfig([
  // index and runtime are ONE build on purpose: the two entries then share
  // every module through common chunks, so an application that imports both
  // 'eligius' and 'eligius/runtime' still has one global data store, one JSON
  // cache and one engine count (see src/test/published/shared-singletons.spec.ts).
  {
    ...base,
    entry: ['./src/index.ts', './src/runtime.ts'],
    banner: {dts: mainDtsBanner},
  },
  {...base, entry: ['./src/metadata.ts'], banner: {dts: domFreeDtsBanner}},
  {
    ...base,
    entry: ['./src/configuration-api.ts'],
    banner: {dts: domFreeDtsBanner},
  },
  {...base, entry: ['./src/lint.ts'], banner: {dts: domFreeDtsBanner}},
]);
