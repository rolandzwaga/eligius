import {resolve} from 'node:path';
import alias from '@rollup/plugin-alias';
import {defineConfig} from 'tsdown';

const srcDir = resolve(import.meta.dirname, 'src');

export default defineConfig({
  entry: ['./src/index.ts'],
  external: ['lottie-web', 'jquery', 'video.js'],
  format: ['esm'],
  platform: 'node',
  sourcemap: true,
  minify: false,
  target: 'es2022',
  exports: true,
  clean: true,
  outDir: './dist',
  plugins: [
    alias({
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
    }) as any,
  ],
});
