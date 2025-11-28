/**
 * react-form-autosave demo
 * @version 0.1.0
 * @author 686f6c61
 * @repository https://github.com/686f6c61/react-form-autosave
 */

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
  },
});
