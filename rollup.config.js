/**
 * react-form-autosave
 * @version 0.1.0
 * @author 686f6c61
 * @license MIT
 * @repository https://github.com/686f6c61/react-form-autosave
 *
 * Rollup configuration for building the library
 */

import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';
import dts from 'rollup-plugin-dts';

const external = ['react', 'react-dom'];

const plugins = [
  resolve(),
  commonjs(),
  typescript({ tsconfig: './tsconfig.json' }),
  terser({
    compress: {
      pure_getters: true,
      unsafe: true,
      unsafe_comps: true,
    },
  }),
];

// Main bundle configuration
const mainConfig = {
  input: 'src/index.ts',
  output: [
    {
      file: 'dist/index.js',
      format: 'cjs',
      sourcemap: true,
      exports: 'named',
    },
    {
      file: 'dist/index.esm.js',
      format: 'esm',
      sourcemap: true,
    },
  ],
  external,
  plugins,
};

// History module (tree-shakeable)
const historyConfig = {
  input: 'src/history/index.ts',
  output: [
    {
      file: 'dist/history.js',
      format: 'cjs',
      sourcemap: true,
      exports: 'named',
    },
    {
      file: 'dist/history.esm.js',
      format: 'esm',
      sourcemap: true,
    },
  ],
  external,
  plugins,
};

// Sync module (tree-shakeable)
const syncConfig = {
  input: 'src/sync/index.ts',
  output: [
    {
      file: 'dist/sync.js',
      format: 'cjs',
      sourcemap: true,
      exports: 'named',
    },
    {
      file: 'dist/sync.esm.js',
      format: 'esm',
      sourcemap: true,
    },
  ],
  external,
  plugins,
};

// DevTools module (tree-shakeable)
const devtoolsConfig = {
  input: 'src/devtools/index.ts',
  output: [
    {
      file: 'dist/devtools.js',
      format: 'cjs',
      sourcemap: true,
      exports: 'named',
    },
    {
      file: 'dist/devtools.esm.js',
      format: 'esm',
      sourcemap: true,
    },
  ],
  external,
  plugins,
};

// Testing utilities module
const testingConfig = {
  input: 'src/testing/index.ts',
  output: [
    {
      file: 'dist/testing.js',
      format: 'cjs',
      sourcemap: true,
      exports: 'named',
    },
    {
      file: 'dist/testing.esm.js',
      format: 'esm',
      sourcemap: true,
    },
  ],
  external,
  plugins,
};

// Type declarations
const dtsConfig = {
  input: 'src/index.ts',
  output: {
    file: 'dist/index.d.ts',
    format: 'esm',
  },
  plugins: [dts()],
  external,
};

const historyDtsConfig = {
  input: 'src/history/index.ts',
  output: {
    file: 'dist/history.d.ts',
    format: 'esm',
  },
  plugins: [dts()],
  external,
};

const syncDtsConfig = {
  input: 'src/sync/index.ts',
  output: {
    file: 'dist/sync.d.ts',
    format: 'esm',
  },
  plugins: [dts()],
  external,
};

const devtoolsDtsConfig = {
  input: 'src/devtools/index.ts',
  output: {
    file: 'dist/devtools.d.ts',
    format: 'esm',
  },
  plugins: [dts()],
  external,
};

const testingDtsConfig = {
  input: 'src/testing/index.ts',
  output: {
    file: 'dist/testing.d.ts',
    format: 'esm',
  },
  plugins: [dts()],
  external,
};

export default [
  mainConfig,
  historyConfig,
  syncConfig,
  devtoolsConfig,
  testingConfig,
  dtsConfig,
  historyDtsConfig,
  syncDtsConfig,
  devtoolsDtsConfig,
  testingDtsConfig,
];
