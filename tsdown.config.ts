import { defineConfig } from 'tsdown';

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
  outDir: './dist'
});
