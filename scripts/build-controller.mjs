import { build } from 'esbuild';
import { execFileSync } from 'node:child_process';
import { cpSync, mkdirSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
rmSync(resolve(root, 'dist'), { recursive: true, force: true });
mkdirSync(resolve(root, 'dist'), { recursive: true });
await build({
  absWorkingDir: root,
  tsconfig: 'tsconfig.controller.json',
  entryPoints: ['packages/page-controller/src/PageController.ts'],
  outfile: 'dist/page-controller.js',
  bundle: true,
  format: 'esm',
  platform: 'browser',
  target: ['es2022'],
  loader: { '.css': 'local-css', '.svg': 'dataurl' },
  define: { 'process.env.NODE_ENV': '"production"' },
  legalComments: 'eof',
  sourcemap: true,
  metafile: true,
  logLevel: 'info',
});
execFileSync(process.execPath, ['node_modules/typescript/bin/tsc', '-p', 'tsconfig.controller.json'], {
  cwd: root,
  stdio: 'inherit',
});
// TypeScript does not copy source declarations that accompany JavaScript input.
mkdirSync(resolve(root, 'dist/types/dom/dom_tree'), { recursive: true });
cpSync(resolve(root, 'packages/page-controller/src/dom/dom_tree/index.d.ts'), resolve(root, 'dist/types/dom/dom_tree/index.d.ts'));
