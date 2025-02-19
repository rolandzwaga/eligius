const esbuild = require('esbuild');

const outDir = 'dist';

const baseConfig = {
  entryPoints: ['src/index.ts'],
  external: ['lottie-web', 'jquery', 'video.js', 'uuid'],
  platform: 'node',
  bundle: true,
  sourcemap: true,
  minify: false,
  splitting: false,
  target: ['esnext'],
};

const esmConfig = {
  ...baseConfig,
  format: 'esm',
  outfile: `${outDir}/index.esm.js`,
};


esbuild.build(esmConfig).catch((res) => {
  console.log('error', res);
  process.exit(1);
});
