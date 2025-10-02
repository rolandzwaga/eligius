import {defineConfig} from 'tsdown';

export default defineConfig({
  entry: ['./src/index.ts'],
  external: ['lottie-web', 'jquery', 'video.js', 'uuid'],
  platform: 'node',
  sourcemap: true,
  minify: false,
  target: 'esnext',
});
