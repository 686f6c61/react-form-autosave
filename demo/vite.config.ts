/**
 * react-form-autosave demo
 * @version 0.1.0
 * @author 686f6c61
 * @repository https://github.com/686f6c61/react-form-autosave
 */

import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const packageJson = JSON.parse(
  readFileSync(new URL('../package.json', import.meta.url), 'utf8')
) as { version: string };

export default defineConfig({
  plugins: [react()],
  define: {
    __LIB_VERSION__: JSON.stringify(packageJson.version),
  },
  server: {
    port: 3000,
  },
});
