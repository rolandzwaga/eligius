const esbuild = require('esbuild');
const fs = require('fs');

const outDir = 'dist';

const baseConfig = {
  entryPoints: ['src/index.ts'],
  external: ['lottie-web', 'jquery', 'video.js', 'uuid'],
  platform: 'node',
  bundle: true,
  sourcemap: true,
  minify: true,
  splitting: false,
  target: ['esnext'],
};

const esmConfig = {
  ...baseConfig,
  format: 'esm',
  outfile: `${outDir}/index.esm.js`,
};

const cjsDevConfig = {
  ...baseConfig,
  minify: false,
  format: 'cjs',
  outfile: `${outDir}/index.cjs.js`,
};

const cjsProdConfig = {
  ...baseConfig,
  format: 'cjs',
  outfile: `${outDir}/index.cjs.min.js`,
};

esbuild.build(esmConfig).catch((res) => {
  console.log('error', res);
  process.exit(1);
});

esbuild.build(cjsDevConfig).catch((res) => {
  console.log('error', res);
  process.exit(1);
});

esbuild
  .build(cjsProdConfig)
  .catch((res) => {
    console.log('error', res);
    process.exit(1);
  })
  .then(() => {
    fs.copyFileSync('./build/index.template.js', `./${outDir}/index.js`);
  });
