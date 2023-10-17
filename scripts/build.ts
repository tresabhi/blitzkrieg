import { build } from 'esbuild';
import { cp, readdir } from 'fs/promises';

readdir('src/workers').then((workers) => {
  const files = [
    'bot',
    'index',

    ...workers.map((file) => `workers/${file.replace('.ts', '')}`),
  ];

  build({
    entryPoints: files.map((file) => `src/${file}.ts`),
    outdir: 'dist/bot',

    platform: 'node',
    tsconfig: 'tsconfig.esbuild.json',
    loader: {
      '.node': 'copy',
      '.ttf': 'file',
    },
    format: 'cjs',
    jsx: 'transform',
    outExtension: {
      '.js': '.cjs',
    },

    bundle: true,
    sourcemap: true,
    minifyIdentifiers: false, // cause goofy errors
    minifySyntax: true,
    minifyWhitespace: true,

    logLevel: 'info',
  });
});

// copy schema.prisma
cp('prisma/schema.prisma', 'dist/bot/schema.prisma');
readdir('node_modules/prisma').then((files) =>
  files
    .filter((file) => file.endsWith('.node'))
    .map((file) => cp(`node_modules/prisma/${file}`, `dist/bot/${file}`)),
);
