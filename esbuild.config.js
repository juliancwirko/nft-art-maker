// eslint-disable-next-line @typescript-eslint/no-var-requires
const esbuild = require('esbuild');

esbuild
  .build({
    entryPoints: ['./src/index.ts', './src/create-preview.ts'],
    bundle: true,
    minify: true,
    outdir: 'build',
    platform: 'node',
    external: ['canvas', 'sha1', 'svgo', 'cosmiconfig'],
  })
  .catch(() => process.exit(1));
