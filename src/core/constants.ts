/**
 * react-form-autosave
 * @version 0.1.2
 * @author 686f6c61
 * @license MIT
 * @repository https://github.com/686f6c61/react-form-autosave
 *
 * Library constants and default values
 */

import type { FormPersistOptions } from './types';

/**
 * Library name for logging and identification
 */
export const LIBRARY_NAME = 'react-form-autosave';

/**
 * Current library version
 */
export const VERSION = '0.1.2';

/**
 * Default storage key prefix
 */
export const DEFAULT_KEY_PREFIX = 'rfp:';

/**
 * Default BroadcastChannel name
 */
export const DEFAULT_SYNC_CHANNEL = 'react-form-autosave-sync';

/**
 * Default debounce delay in milliseconds
 */
export const DEFAULT_DEBOUNCE = 500;

/**
 * Default schema version
 */
export const DEFAULT_VERSION = 1;

/**
 * Default maximum history entries for undo/redo
 */
export const DEFAULT_MAX_HISTORY = 50;

/**
 * Default compression threshold in bytes
 */
export const DEFAULT_COMPRESSION_THRESHOLD = 1024;

/**
 * Default partition size in bytes (4KB to stay well under 5MB limit)
 */
export const DEFAULT_PARTITION_SIZE = 4096;

/**
 * Maximum localStorage size (5MB as per spec)
 */
export const MAX_STORAGE_SIZE = 5 * 1024 * 1024;

/**
 * Warning threshold for storage size (4MB)
 */
export const DEFAULT_WARN_SIZE = 4 * 1024 * 1024;

/**
 * Default options applied to all hooks
 */
export const DEFAULT_OPTIONS: Required<
  Pick<
    FormPersistOptions<unknown>,
    | 'storage'
    | 'debounce'
    | 'enabled'
    | 'version'
    | 'merge'
    | 'debug'
    | 'persistMode'
    | 'exclude'
  >
> = {
  storage: 'localStorage',
  debounce: DEFAULT_DEBOUNCE,
  enabled: true,
  version: DEFAULT_VERSION,
  merge: 'shallow',
  debug: false,
  persistMode: 'full',
  exclude: [],
};
