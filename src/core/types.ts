/**
 * react-form-autosave
 * @version 0.1.2
 * @author 686f6c61
 * @license MIT
 * @repository https://github.com/686f6c61/react-form-autosave
 *
 * Core type definitions for the library
 * This file contains all TypeScript interfaces and types used throughout the library.
 */

/**
 * Supported storage types for persisting form data
 */
export type StorageType = 'localStorage' | 'sessionStorage' | 'memory';

/**
 * Custom storage adapter interface
 * Implement this interface to create a custom storage backend
 *
 * @example
 * ```typescript
 * const customStorage: StorageAdapter = {
 *   getItem: (key) => myDatabase.get(key),
 *   setItem: (key, value) => myDatabase.set(key, value),
 *   removeItem: (key) => myDatabase.delete(key),
 * };
 * ```
 */
export interface StorageAdapter {
  /** Retrieve an item from storage */
  getItem(key: string): string | null | Promise<string | null>;
  /** Store an item in storage */
  setItem(key: string, value: string): void | Promise<void>;
  /** Remove an item from storage */
  removeItem(key: string): void | Promise<void>;
}

/**
 * Merge strategies for combining stored data with initial state
 */
export type MergeStrategy = 'shallow' | 'deep' | 'prefer-stored' | 'prefer-initial';

/**
 * Custom merge function type
 * @param stored - The data retrieved from storage
 * @param initial - The initial state provided to the hook
 * @returns The merged state
 */
export type MergeFn<T> = (stored: Partial<T>, initial: T) => T;

/**
 * Transform functions for serializing/deserializing data
 * Use this for encryption, encoding, or custom data transformation
 */
export interface TransformOptions<T> {
  /** Transform data before saving to storage */
  serialize?: (data: T) => string;
  /** Transform data after reading from storage */
  deserialize?: (data: string) => T;
}

/**
 * Sync strategy for handling conflicts between tabs
 */
export type SyncStrategy = 'latest-wins' | 'merge' | 'ask-user';

/**
 * Sync configuration options
 */
export interface SyncOptions<T> {
  /** Enable synchronization between browser tabs */
  enabled?: boolean;
  /** Custom BroadcastChannel name */
  channel?: string;
  /** Strategy for resolving conflicts */
  strategy?: SyncStrategy;
  /** Custom conflict resolver function */
  conflictResolver?: (local: T, remote: T) => T;
  /** Callback when sync event is received */
  onSync?: (data: T, source: 'storage' | 'broadcast') => void;
}

/**
 * History configuration for undo/redo functionality
 */
export interface HistoryOptions {
  /** Enable undo/redo history */
  enabled?: boolean;
  /** Maximum number of states to keep in history */
  maxHistory?: number;
}

/**
 * Compression configuration
 */
export interface CompressionOptions {
  /** Enable compression */
  enabled?: boolean;
  /** Minimum size in bytes before compressing */
  threshold?: number;
}

/**
 * Partition configuration for large data sets
 */
export interface PartitionOptions {
  /** Enable partitioning of large data */
  enabled?: boolean;
  /** Maximum size per partition in bytes */
  maxSize?: number;
}

/**
 * Schema migration function type
 * @param oldData - Data from the previous schema version
 * @param oldVersion - The version number of the stored data
 * @returns Migrated data compatible with the current schema
 */
export type MigrateFn<T> = (oldData: unknown, oldVersion: number) => T;

/**
 * Error types that can occur during persistence operations
 */
export type PersistError =
  | 'STORAGE_FULL'
  | 'QUOTA_EXCEEDED'
  | 'CORRUPTED_DATA'
  | 'PARSE_ERROR'
  | 'VALIDATION_FAILED'
  | 'MIGRATION_FAILED'
  | 'UNKNOWN';

/**
 * Error object passed to error handlers
 */
export interface PersistErrorInfo {
  /** Type of error that occurred */
  type: PersistError;
  /** Original error object if available */
  error?: Error;
  /** Error message */
  message: string;
  /** The key that was being operated on */
  key: string;
}

/**
 * Main configuration options for useFormPersist hook
 * All options have sensible defaults and are optional
 */
export interface FormPersistOptions<T> {
  /**
   * Storage backend to use
   * @default 'localStorage'
   */
  storage?: StorageType | StorageAdapter;

  /**
   * Debounce delay in milliseconds before saving
   * @default 500
   */
  debounce?: number;

  /**
   * Throttle interval in milliseconds (in addition to debounce)
   */
  throttle?: number;

  /**
   * Expiration time in minutes after which data is discarded
   */
  expiration?: number;

  /**
   * Fields to exclude from persistence (e.g., passwords)
   * @default []
   */
  exclude?: (keyof T)[];

  /**
   * Transform functions for custom serialization/encryption
   */
  transform?: TransformOptions<T>;

  /**
   * Callback executed when data is restored from storage
   */
  onRestore?: (data: T) => void;

  /**
   * Callback for handling persistence errors
   */
  onError?: (error: PersistErrorInfo) => void;

  /**
   * Callback specifically for storage full errors
   */
  onStorageFull?: (error: PersistErrorInfo) => void;

  /**
   * Strategy for merging stored data with initial state
   * @default 'shallow'
   */
  merge?: MergeStrategy | MergeFn<T>;

  /**
   * Schema version number for migration support
   * @default 1
   */
  version?: number;

  /**
   * Migration function for updating data from older schema versions
   */
  migrate?: MigrateFn<T>;

  /**
   * Compression options for large data
   */
  compress?: boolean | CompressionOptions;

  /**
   * Synchronization options for multi-tab support
   */
  sync?: boolean | SyncOptions<T>;

  /**
   * History options for undo/redo support
   */
  history?: boolean | HistoryOptions;

  /**
   * Enable/disable persistence (useful for GDPR compliance)
   * @default true
   */
  enabled?: boolean;

  /**
   * Validation function to check data before persisting
   * Return false to prevent saving
   */
  validate?: (data: T) => boolean;

  /**
   * Transform data before persisting
   */
  beforePersist?: (data: T) => T;

  /**
   * Enable debug logging to console
   * @default false
   */
  debug?: boolean;

  /**
   * Global key prefix for all storage keys
   */
  keyPrefix?: string;

  /**
   * Partition options for handling large data sets
   */
  partition?: boolean | PartitionOptions;

  /**
   * Persist mode: 'full' saves entire state, 'dirty' saves only changed fields
   * @default 'full'
   */
  persistMode?: 'full' | 'dirty';

  /**
   * Warn when storage size exceeds this threshold (in bytes)
   */
  warnSize?: number;
}

/**
 * Actions returned by the useFormPersist hook
 * These provide control over the persistence behavior
 */
export interface FormPersistActions<T> {
  /** Clear persisted data from storage */
  clear: () => void;

  /** Whether there is persisted data in storage */
  isPersisted: boolean;

  /** Whether data was restored on mount */
  isRestored: boolean;

  /** Timestamp of the last successful save */
  lastSaved: number | null;

  /** Force an immediate save, bypassing debounce */
  forceSave: () => void;

  /** Pause automatic persistence */
  pause: () => void;

  /** Resume automatic persistence */
  resume: () => void;

  /** Whether persistence is currently paused */
  isPaused: boolean;

  /** Undo the last state change (requires history enabled) */
  undo: () => void;

  /** Redo the last undone change (requires history enabled) */
  redo: () => void;

  /** Whether undo is available */
  canUndo: boolean;

  /** Whether redo is available */
  canRedo: boolean;

  /** Current position in history */
  historyIndex: number;

  /** Total number of states in history */
  historyLength: number;

  /**
   * Wrapper for form submit handlers that clears storage on success
   * @param handler - The original submit handler
   * @returns Wrapped handler that clears storage if no error is thrown
   */
  withClear: <R>(handler: () => R | Promise<R>) => () => Promise<R>;

  /** Reset state to initial value and clear storage */
  reset: () => void;

  /** Get the currently persisted value without triggering restore */
  getPersistedValue: () => T | null;

  /** Whether current state differs from initial state */
  isDirty: boolean;

  /** Current size of persisted data in bytes */
  size: number;

  /** Revert to the last saved state */
  revert: () => void;
}

/**
 * Return type for the useFormPersist hook (array format)
 */
export type UseFormPersistReturn<T> = [
  /** Current state */
  T,
  /** State setter function */
  React.Dispatch<React.SetStateAction<T>>,
  /** Actions object */
  FormPersistActions<T>
];

/**
 * Return type for the useFormPersist hook (object format)
 */
export interface UseFormPersistReturnObject<T> extends FormPersistActions<T> {
  /** Current state */
  state: T;
  /** State setter function */
  setState: React.Dispatch<React.SetStateAction<T>>;
}

/**
 * Internal persisted data structure with metadata
 */
export interface PersistedData<T> {
  /** The actual form data */
  data: T;
  /** Timestamp when data was saved */
  timestamp: number;
  /** Schema version of the saved data */
  version: number;
  /** Optional expiration timestamp */
  expiresAt?: number;
}

/**
 * Provider context configuration
 */
export interface FormPersistContextValue {
  /** Default options applied to all hooks */
  defaults: Partial<FormPersistOptions<unknown>>;
  /** Registry of all active form persist instances */
  registry: Map<string, FormPersistRegistryEntry>;
}

/**
 * Registry entry for tracking form persist instances
 */
export interface FormPersistRegistryEntry {
  /** Storage key */
  key: string;
  /** Current state */
  state: unknown;
  /** Last saved timestamp */
  lastSaved: number | null;
  /** Size in bytes */
  size: number;
  /** Whether persistence is paused */
  isPaused: boolean;
}

/**
 * AutoSaveIndicator component props
 */
export interface AutoSaveIndicatorProps {
  /** Last saved timestamp */
  lastSaved: number | null;
  /** Whether currently saving */
  isSaving?: boolean;
  /** Custom "Saving..." text */
  savingText?: string;
  /** Custom "Saved" text */
  savedText?: string;
  /** Custom "Not saved" text */
  notSavedText?: string;
  /** Show relative timestamp (e.g., "2 minutes ago") */
  showTimestamp?: boolean;
  /** Custom className */
  className?: string;
  /** Custom inline styles */
  style?: React.CSSProperties;
}

/**
 * DevTools component props
 */
export interface FormPersistDevToolsProps {
  /** Position on screen */
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  /** Whether panel is open by default */
  defaultOpen?: boolean;
  /** Filter function for which forms to show */
  filter?: (key: string) => boolean;
  /** Enable timeline view */
  timeline?: boolean;
  /** Custom className */
  className?: string;
}
