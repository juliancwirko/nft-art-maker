// eslint-disable-next-line @typescript-eslint/no-var-requires
import esbuild from 'esbuild';

esbuild
  .build({
    entryPoints: [
      './src/index.ts',
      './src/create-preview.ts',
      './src/ipfs-pack.ts',
      './src/upload-car.ts',
    ],
    format: 'esm',
    bundle: true,
    minify: true,
    outdir: 'build',
    platform: 'node',
    external: [
      'canvas',
      'svgo',
      'cosmiconfig',
      'ipfs-car',
      'dot-prop',
      'nft.storage',
      '@ipld/car',
    ],
  })
  .catch(() => process.exit(1));
