/**
 * react-form-autosave
 * @version 0.1.2
 * @author 686f6c61
 * @license MIT
 * @repository https://github.com/686f6c61/react-form-autosave
 *
 * Storage module exports
 */

export {
  createMemoryStorage,
  isStorageAvailable,
  getStorageAdapter,
  isSSR,
  getStringByteSize,
  getStorageSize,
  clearStorageByPrefix,
} from './adapters';
