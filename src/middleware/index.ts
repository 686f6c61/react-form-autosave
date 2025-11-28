/**
 * react-form-autosave
 * @version 0.1.2
 * @author 686f6c61
 * @license MIT
 * @repository https://github.com/686f6c61/react-form-autosave
 *
 * Middleware module exports
 */

export {
  createDebouncedFn,
  createThrottledFn,
  createSaveController,
} from './debounce';

export {
  defaultSerialize,
  defaultDeserialize,
  base64Encode,
  base64Decode,
  simpleCompress,
  simpleDecompress,
  createTransformPipeline,
  wrapWithMetadata,
  unwrapData,
  filterExcludedFields,
} from './transform';

export {
  shallowMerge,
  deepMerge,
  preferStoredMerge,
  preferInitialMerge,
  getMergeFunction,
  isEqual,
} from './merge';

export {
  isValidPersistedData,
  isExpired,
  needsMigration,
  migrateData,
  createErrorInfo,
  detectErrorType,
  safeJsonParse,
  validateData,
} from './validate';
