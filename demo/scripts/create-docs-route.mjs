import { cpSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const demoRoot = resolve(scriptDir, '..');
const distDir = resolve(demoRoot, 'dist');
const srcIndex = resolve(distDir, 'index.html');
const docsDir = resolve(distDir, 'docs');
const docsIndex = resolve(docsDir, 'index.html');

if (!existsSync(srcIndex)) {
  throw new Error('Build output not found: dist/index.html');
}

mkdirSync(docsDir, { recursive: true });
cpSync(srcIndex, docsIndex);

console.log('Created static docs route:', docsIndex);
