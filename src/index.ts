/**
 * react-form-autosave
 * @version 0.1.2
 * @author 686f6c61
 * @license MIT
 * @repository https://github.com/686f6c61/react-form-autosave
 *
 * Main entry point - exports core functionality
 * Optional modules (history, sync, devtools, testing) are available as separate imports
 * for tree-shaking optimization.
 *
 * @example Basic usage
 * ```tsx
 * import { useFormPersist } from 'react-form-autosave';
 *
 * function MyForm() {
 *   const [formData, setFormData, { clear }] = useFormPersist('myForm', {
 *     name: '',
 *     email: '',
 *   });
 *
 *   return (
 *     <form onSubmit={() => clear()}>
 *       <input
 *         value={formData.name}
 *         onChange={(e) => setFormData({ ...formData, name: e.target.value })}
 *       />
 *     </form>
 *   );
 * }
 * ```
 *
 * @example With provider
 * ```tsx
 * import { FormPersistProvider, useFormPersist } from 'react-form-autosave';
 *
 * function App() {
 *   return (
 *     <FormPersistProvider defaults={{ debounce: 1000 }}>
 *       <MyForm />
 *     </FormPersistProvider>
 *   );
 * }
 * ```
 *
 * @example Optional imports
 * ```tsx
 * import { useHistory } from 'react-form-autosave/history';
 * import { useSync } from 'react-form-autosave/sync';
 * import { FormPersistDevTools } from 'react-form-autosave/devtools';
 * import { createMockStorage } from 'react-form-autosave/testing';
 * ```
 */

// Core types
export type {
  StorageType,
  StorageAdapter,
  MergeStrategy,
  MergeFn,
  TransformOptions,
  SyncStrategy,
  SyncOptions,
  HistoryOptions,
  CompressionOptions,
  PartitionOptions,
  MigrateFn,
  PersistError,
  PersistErrorInfo,
  FormPersistOptions,
  FormPersistActions,
  UseFormPersistReturn,
  UseFormPersistReturnObject,
  PersistedData,
  FormPersistContextValue,
  FormPersistRegistryEntry,
  AutoSaveIndicatorProps,
  FormPersistDevToolsProps,
} from './core/types';

// Constants
export {
  LIBRARY_NAME,
  VERSION,
  DEFAULT_KEY_PREFIX,
  DEFAULT_DEBOUNCE,
  DEFAULT_VERSION,
  DEFAULT_MAX_HISTORY,
} from './core/constants';

// Main hook
export { useFormPersist, useFormPersistObject } from './hooks';

// Provider and components
export {
  FormPersistProvider,
  useFormPersistContext,
  useFormRegistry,
  AutoSaveIndicator,
} from './components';

export type { FormPersistProviderProps } from './components';

// Utilities
export {
  clearGroup,
  getGroupKeys,
  hasGroupData,
  getGroupSize,
} from './utils';

// Storage utilities (for advanced use cases)
export {
  createMemoryStorage,
  isStorageAvailable,
  getStorageAdapter,
  isSSR,
} from './storage';
