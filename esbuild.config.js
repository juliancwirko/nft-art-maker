// eslint-disable-next-line @typescript-eslint/no-var-requires
const esbuild = require('esbuild');

esbuild
  .build({
    entryPoints: [
      './src/index.ts',
      './src/create-preview.ts',
      './src/ipfs-pack.ts',
    ],
    bundle: true,
    minify: true,
    outdir: 'build',
    platform: 'node',
    external: ['canvas', 'svgo', 'cosmiconfig', 'ipfs-car'],
  })
  .catch(() => process.exit(1));
