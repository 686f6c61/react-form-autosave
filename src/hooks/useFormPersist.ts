/**
 * react-form-autosave
 * @version 0.1.2
 * @author 686f6c61
 * @license MIT
 * @repository https://github.com/686f6c61/react-form-autosave
 *
 * Main hook for persisting form state
 * Provides a useState-like API with automatic persistence to storage
 */

import {
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo,
} from 'react';

import type {
  FormPersistOptions,
  FormPersistActions,
  UseFormPersistReturn,
  StorageAdapter,
  MergeFn,
  MergeStrategy,
  PartitionOptions,
  SyncOptions,
  TransformOptions,
  PersistedData,
} from '../core/types';

import {
  DEFAULT_OPTIONS,
  DEFAULT_KEY_PREFIX,
  DEFAULT_MAX_HISTORY,
  DEFAULT_PARTITION_SIZE,
} from '../core/constants';

import { getStorageAdapter, isSSR, getStringByteSize } from '../storage';

import {
  createSaveController,
  createTransformPipeline,
  wrapWithMetadata,
  filterExcludedFields,
  getMergeFunction,
  isValidPersistedData,
  isExpired,
  migrateData,
  createErrorInfo,
  detectErrorType,
  validateData,
  isEqual,
} from '../middleware';

import { useFormPersistContext } from '../components/FormPersistProvider';
import { SyncManager } from '../sync/syncManager';

/**
 * Debug logger utility
 */
function debugLog(enabled: boolean, ...args: unknown[]): void {
  if (enabled && typeof console !== 'undefined') {
    // eslint-disable-next-line no-console
    console.log('[react-form-autosave]', ...args);
  }
}

function isPromiseLike<T>(value: unknown): value is Promise<T> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'then' in value &&
    typeof (value as { then?: unknown }).then === 'function'
  );
}

const PARTITION_MARKER = '__rfp_partitioned__';

interface PartitionManifest {
  __rfp_partitioned__: true;
  count: number;
}

function parsePartitionManifest(raw: string): PartitionManifest | null {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') {
      return null;
    }

    const candidate = parsed as Record<string, unknown>;
    const count = candidate.count;
    if (
      candidate[PARTITION_MARKER] === true &&
      typeof count === 'number' &&
      Number.isInteger(count) &&
      count > 0
    ) {
      return {
        __rfp_partitioned__: true,
        count,
      };
    }
  } catch {
    // Not a partition manifest
  }
  return null;
}

function splitIntoPartitions(data: string, maxSizeBytes: number): string[] {
  const chunkCharSize = Math.max(1, Math.floor(maxSizeBytes / 2));
  const chunks: string[] = [];

  for (let i = 0; i < data.length; i += chunkCharSize) {
    chunks.push(data.slice(i, i + chunkCharSize));
  }

  return chunks;
}

function getDirtyData<T extends Record<string, unknown>>(
  current: T,
  initial: T
): Partial<T> {
  const dirty: Partial<T> = {};
  for (const key of Object.keys(current) as (keyof T)[]) {
    if (!isEqual(current[key], initial[key])) {
      dirty[key] = current[key];
    }
  }
  return dirty;
}

/**
 * Main hook for persisting form state to storage
 *
 * @param key - Unique key for storing data
 * @param initialState - Initial state value
 * @param options - Configuration options
 * @returns Tuple of [state, setState, actions]
 *
 * @example
 * ```tsx
 * // Basic usage
 * const [formData, setFormData, { clear }] = useFormPersist('myForm', {
 *   name: '',
 *   email: '',
 * });
 *
 * // With options
 * const [formData, setFormData, actions] = useFormPersist(
 *   'checkout',
 *   { items: [], total: 0 },
 *   {
 *     debounce: 1000,
 *     expiration: 60, // 1 hour
 *     exclude: ['creditCard'],
 *     onRestore: (data) => console.log('Restored:', data),
 *   }
 * );
 *
 * // Clear after successful submit
 * const handleSubmit = actions.withClear(async () => {
 *   await api.submit(formData);
 * });
 * ```
 */
export function useFormPersist<T extends Record<string, unknown>>(
  key: string,
  initialState: T,
  options: FormPersistOptions<T> = {}
): UseFormPersistReturn<T> {
  // Merge with context defaults
  const contextDefaults = useFormPersistContext() as Partial<FormPersistOptions<T>>;
  const mergedOptions = useMemo(
    () => ({
      ...DEFAULT_OPTIONS,
      ...contextDefaults,
      ...options,
    }) as FormPersistOptions<T>,
    [contextDefaults, options]
  );

  const {
    storage: storageType,
    debounce: debounceMs,
    throttle: throttleMs,
    expiration,
    exclude,
    transform,
    onRestore,
    onError,
    onStorageFull,
    merge: mergeStrategy,
    version,
    migrate,
    compress,
    sync,
    history: historyOption,
    enabled,
    validate,
    beforePersist,
    debug,
    keyPrefix,
    partition,
    persistMode,
    warnSize,
  } = mergedOptions;

  const syncOptions = useMemo<SyncOptions<T>>(() => {
    if (!sync) {
      return { enabled: false };
    }
    if (sync === true) {
      return { enabled: true };
    }
    return {
      ...sync,
      enabled: sync.enabled ?? true,
    };
  }, [sync]);

  const historyEnabled = useMemo(() => {
    if (!historyOption) return false;
    if (historyOption === true) return true;
    return historyOption.enabled ?? true;
  }, [historyOption]);

  const maxHistory = useMemo(() => {
    if (historyOption && typeof historyOption === 'object') {
      return historyOption.maxHistory ?? DEFAULT_MAX_HISTORY;
    }
    return DEFAULT_MAX_HISTORY;
  }, [historyOption]);

  const partitionOptions = useMemo<Required<PartitionOptions>>(() => {
    if (!partition) {
      return { enabled: false, maxSize: DEFAULT_PARTITION_SIZE };
    }
    if (partition === true) {
      return { enabled: true, maxSize: DEFAULT_PARTITION_SIZE };
    }
    const maxSize = Math.max(1, partition.maxSize ?? DEFAULT_PARTITION_SIZE);
    return {
      enabled: partition.enabled ?? true,
      maxSize,
    };
  }, [partition]);

  // Compute full storage key
  /* istanbul ignore next -- @preserve Optional chaining branches */
  const fullKey = useMemo(() => {
    const prefix = keyPrefix ?? DEFAULT_KEY_PREFIX;
    return `${prefix}${key}`;
  }, [key, keyPrefix]);

  const getPartitionKey = useCallback(
    (index: number): string => `${fullKey}:part:${index}`,
    [fullKey]
  );

  // Get storage adapter
  const storage = useMemo<StorageAdapter>(
    () => getStorageAdapter(storageType),
    [storageType]
  );

  // Create transform pipeline
  const transformer = useMemo(
    () =>
      createTransformPipeline<PersistedData<unknown>>(
        transform as TransformOptions<PersistedData<unknown>> | undefined,
        compress,
        false
      ),
    [transform, compress]
  );

  // Get merge function
  const mergeFn = useMemo(
    () =>
      getMergeFunction<T>(
        mergeStrategy as MergeStrategy | MergeFn<T> | undefined
      ),
    [mergeStrategy]
  );

  // State
  const [state, setStateInternal] = useState<T>(initialState);
  const [isPersisted, setIsPersisted] = useState(false);
  const [isRestored, setIsRestored] = useState(false);
  const [lastSaved, setLastSaved] = useState<number | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [size, setSize] = useState(0);

  // History state for undo/redo
  const [history, setHistory] = useState<T[]>([initialState]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Refs
  const stateRef = useRef(state);
  const initialStateRef = useRef(initialState);
  const loadedKeyRef = useRef<string | null>(null);
  const historyIndexRef = useRef(historyIndex);
  const syncManagerRef = useRef<SyncManager<T> | null>(null);

  // Keep stateRef in sync
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    historyIndexRef.current = historyIndex;
  }, [historyIndex]);

  // Error handler
  /* istanbul ignore next -- @preserve Error handler callback branches */
  const handleError = useCallback(
    (type: Parameters<typeof createErrorInfo>[0], message: string, error?: Error) => {
      const errorInfo = createErrorInfo(type, fullKey, message, error);
      debugLog(debug ?? false, 'Error:', errorInfo);

      if (type === 'QUOTA_EXCEEDED' || type === 'STORAGE_FULL') {
        onStorageFull?.(errorInfo);
      }
      onError?.(errorInfo);
    },
    [fullKey, debug, onStorageFull, onError]
  );

  // Save to storage function
  /* istanbul ignore next -- @preserve Save function with optional branches */
  const saveToStorage = useCallback(
    (dataToSave: T) => {
      if (!enabled || isPaused || isSSR()) {
        return;
      }

      try {
        // Apply beforePersist transform
        const processedData: T = beforePersist ? beforePersist(dataToSave) : dataToSave;

        // Validate data
        if (!validateData(processedData, validate)) {
          debugLog(debug ?? false, 'Validation failed, skipping save');
          return;
        }

        let dataForStorage: T | Partial<T> =
          persistMode === 'dirty'
            ? getDirtyData(processedData, initialStateRef.current)
            : processedData;

        // Filter excluded fields after validation (validation expects full T)
        if (exclude && exclude.length > 0) {
          dataForStorage = filterExcludedFields(dataForStorage as T, exclude);
        }

        // Wrap with metadata
        const wrapped = wrapWithMetadata(dataForStorage, version ?? 1, expiration);

        // Serialize
        const serialized = transformer.serialize(wrapped);

        // Check size warning
        const dataSize = getStringByteSize(serialized);
        if (warnSize && dataSize > warnSize) {
          console.warn(
            `[react-form-autosave] Data size (${dataSize} bytes) exceeds warning threshold (${warnSize} bytes)`
          );
        }

        const executeWrite = (
          existingRaw: string | null
        ): void | Promise<void> => {
          const existingManifest = existingRaw
            ? parsePartitionManifest(existingRaw)
            : null;
          const cleanupOps: Array<void | Promise<void>> = [];

          if (existingManifest) {
            for (let i = 0; i < existingManifest.count; i++) {
              cleanupOps.push(storage.removeItem(getPartitionKey(i)));
            }
          }

          const shouldWritePartitions =
            partitionOptions.enabled && dataSize > partitionOptions.maxSize;

          if (shouldWritePartitions) {
            const chunks = splitIntoPartitions(serialized, partitionOptions.maxSize);
            const writeOps: Array<void | Promise<void>> = chunks.map(
              (chunk, index) => storage.setItem(getPartitionKey(index), chunk)
            );

            const manifest = JSON.stringify({
              [PARTITION_MARKER]: true,
              count: chunks.length,
            });

            const ops = [
              ...cleanupOps,
              ...writeOps,
              storage.setItem(fullKey, manifest),
            ];

            if (ops.some((op) => isPromiseLike<void>(op))) {
              return Promise.all(ops.map((op) => Promise.resolve(op))).then(() => undefined);
            }
            return;
          }

          const mainWrite = storage.setItem(fullKey, serialized);
          const ops = [...cleanupOps, mainWrite];
          if (ops.some((op) => isPromiseLike<void>(op))) {
            return Promise.all(ops.map((op) => Promise.resolve(op))).then(() => undefined);
          }
        };

        const commitSuccess = () => {
          syncManagerRef.current?.setLocalData(processedData);
          syncManagerRef.current?.broadcast(processedData);

          setIsPersisted(true);
          setLastSaved(Date.now());
          setSize(dataSize);
          debugLog(debug ?? false, 'Saved to storage:', fullKey);
        };

        const existingRaw = storage.getItem(fullKey);
        const writeResult = isPromiseLike<string | null>(existingRaw)
          ? existingRaw.then((raw) =>
              executeWrite(typeof raw === 'string' ? raw : null)
            )
          : executeWrite(typeof existingRaw === 'string' ? existingRaw : null);

        if (isPromiseLike<void>(writeResult)) {
          void writeResult
            .then(() => {
              commitSuccess();
            })
            .catch((e: unknown) => {
              const error = e instanceof Error ? e : new Error(String(e));
              const errorType = detectErrorType(error);
              handleError(errorType, error.message, error);
            });
          return;
        }

        commitSuccess();
      } catch (e) {
        const error = e instanceof Error ? e : new Error(String(e));
        const errorType = detectErrorType(error);
        handleError(errorType, error.message, error);
      }
    },
    [
      enabled,
      isPaused,
      beforePersist,
      exclude,
      validate,
      persistMode,
      version,
      expiration,
      partitionOptions.enabled,
      partitionOptions.maxSize,
      transformer,
      warnSize,
      storage,
      getPartitionKey,
      fullKey,
      debug,
      handleError,
    ]
  );

  // Create debounced save controller
  /* istanbul ignore next -- @preserve SaveController with optional debounce/throttle */
  const saveController = useMemo(
    () => createSaveController(saveToStorage, debounceMs ?? 500, throttleMs),
    [saveToStorage, debounceMs, throttleMs]
  );

  // Load from storage on mount
  /* istanbul ignore next -- @preserve Load effect with optional branches */
  useEffect(() => {
    if (isSSR() || !enabled) {
      return;
    }

    // Avoid duplicate restore for the same storage key, but allow reload on key change.
    if (loadedKeyRef.current === fullKey) {
      return;
    }
    loadedKeyRef.current = fullKey;

    const loadFromStorage = async () => {
      try {
        const primaryRaw = await storage.getItem(fullKey);
        if (!primaryRaw || typeof primaryRaw !== 'string') {
          debugLog(debug ?? false, 'No stored data found for:', fullKey);
          return;
        }

        const partitionManifest = parsePartitionManifest(primaryRaw);
        let raw = primaryRaw;

        if (partitionManifest) {
          let reconstructed = '';
          for (let i = 0; i < partitionManifest.count; i++) {
            const chunk = await storage.getItem(getPartitionKey(i));
            if (!chunk || typeof chunk !== 'string') {
              handleError('CORRUPTED_DATA', 'Missing partition chunk');
              return;
            }
            reconstructed += chunk;
          }
          raw = reconstructed;
        }

        // Deserialize
        const parsed = transformer.deserialize(raw);

        if (!parsed) {
          handleError('CORRUPTED_DATA', 'Failed to parse stored data');
          return;
        }

        // Validate structure
        if (!isValidPersistedData<unknown>(parsed)) {
          handleError('CORRUPTED_DATA', 'Invalid data structure');
          return;
        }

        const persisted = parsed as PersistedData<unknown>;

        // Check expiration
        if (isExpired(persisted)) {
          debugLog(debug ?? false, 'Stored data expired, clearing');
          const removeOps: Array<void | Promise<void>> = [storage.removeItem(fullKey)];
          if (partitionManifest) {
            for (let i = 0; i < partitionManifest.count; i++) {
              removeOps.push(storage.removeItem(getPartitionKey(i)));
            }
          }
          if (removeOps.some((op) => isPromiseLike<void>(op))) {
            await Promise.all(removeOps.map((op) => Promise.resolve(op)));
          }
          return;
        }

        // Migrate if needed
        const migratedData = migrateData<T>(
          persisted.data,
          persisted.version,
          version ?? 1,
          migrate
        );

        if (migratedData === null) {
          handleError('MIGRATION_FAILED', 'Failed to migrate data');
          return;
        }

        // Merge with initial state
        const mergedData = mergeFn(migratedData as Partial<T>, initialState);
        syncManagerRef.current?.setLocalData(mergedData);

        // Update state
        setStateInternal(mergedData);
        setIsPersisted(true);
        setIsRestored(true);
        setLastSaved(persisted.timestamp);

        if (historyEnabled) {
          setHistory([mergedData]);
          setHistoryIndex(0);
        }

        // Call onRestore callback
        onRestore?.(mergedData);
        debugLog(debug ?? false, 'Restored from storage:', fullKey);
      } catch (e) /* istanbul ignore next -- @preserve Defensive error handling */ {
        const error = e instanceof Error ? e : new Error(String(e));
        handleError('UNKNOWN', error.message, error);
      }
    };

    loadFromStorage();
  }, [
    fullKey,
    enabled,
    storage,
    transformer,
    version,
    migrate,
    mergeFn,
    initialState,
    historyEnabled,
    getPartitionKey,
    onRestore,
    debug,
    handleError,
  ]);

  // Sync state across tabs when enabled.
  useEffect(() => {
    if (isSSR() || !syncOptions.enabled) {
      return;
    }

    const manager = new SyncManager<T>(fullKey, {
      enabled: true,
      channel: syncOptions.channel,
      strategy: syncOptions.strategy,
      conflictResolver: syncOptions.conflictResolver,
      onSync: syncOptions.onSync,
    });
    syncManagerRef.current = manager;
    manager.setLocalData(stateRef.current);

    manager.onSync((incomingData, source) => {
      if (incomingData === undefined) {
        stateRef.current = initialStateRef.current;
        setStateInternal(initialStateRef.current);
        setIsPersisted(false);
        setLastSaved(null);
        setSize(0);
        if (historyEnabled) {
          setHistory([initialStateRef.current]);
          setHistoryIndex(0);
        }
        debugLog(debug ?? false, `Cleared from ${source}:`, fullKey);
        return;
      }

      const nextState = mergeFn(
        incomingData as Partial<T>,
        initialStateRef.current
      );

      if (isEqual(nextState, stateRef.current)) {
        return;
      }

      stateRef.current = nextState;
      manager.setLocalData(nextState);
      setStateInternal(nextState);
      setIsPersisted(true);
      setLastSaved(Date.now());

      if (historyEnabled) {
        setHistory((prev) => {
          const nextHistory = prev.slice(0, historyIndexRef.current + 1);
          nextHistory.push(nextState);
          if (nextHistory.length > maxHistory) {
            nextHistory.shift();
          }
          return nextHistory;
        });
        setHistoryIndex((prev) => Math.min(prev + 1, maxHistory - 1));
      }

      debugLog(debug ?? false, `Synced from ${source}:`, fullKey);
    });

    manager.requestSync();

    return () => {
      manager.destroy();
      if (syncManagerRef.current === manager) {
        syncManagerRef.current = null;
      }
    };
  }, [
    fullKey,
    syncOptions.enabled,
    syncOptions.channel,
    syncOptions.strategy,
    syncOptions.conflictResolver,
    syncOptions.onSync,
    mergeFn,
    debug,
    historyEnabled,
    maxHistory,
  ]);

  // Flush on unmount
  useEffect(() => {
    return () => {
      saveController.flush();
    };
  }, [saveController]);

  // Custom setState that triggers save
  /* istanbul ignore next -- @preserve setState with optional history branches */
  const setState = useCallback<React.Dispatch<React.SetStateAction<T>>>(
    (action) => {
      setStateInternal((prevState) => {
        const newState =
          typeof action === 'function'
            ? (action as (prev: T) => T)(prevState)
            : action;

        // Update history if enabled
        if (historyEnabled) {
          setHistory((prev) => {
            const newHistory = prev.slice(0, historyIndexRef.current + 1);
            newHistory.push(newState);
            /* istanbul ignore if -- @preserve History trimming edge case */
            if (newHistory.length > maxHistory) {
              newHistory.shift();
            }
            setHistoryIndex(newHistory.length - 1);
            return newHistory;
          });
        }

        syncManagerRef.current?.setLocalData(newState);

        // Schedule save
        saveController.save(newState);

        return newState;
      });
    },
    [saveController, historyEnabled, maxHistory]
  );

  // Clear storage
  /* istanbul ignore next -- @preserve Clear function with optional debug */
  const clear = useCallback(() => {
    try {
      const removeStoredData = (
        existingRaw: string | null
      ): void | Promise<void> => {
        const manifest = existingRaw ? parsePartitionManifest(existingRaw) : null;
        const removeOps: Array<void | Promise<void>> = [storage.removeItem(fullKey)];

        if (manifest) {
          for (let i = 0; i < manifest.count; i++) {
            removeOps.push(storage.removeItem(getPartitionKey(i)));
          }
        }

        if (removeOps.some((op) => isPromiseLike<void>(op))) {
          return Promise.all(removeOps.map((op) => Promise.resolve(op))).then(() => undefined);
        }
      };

      const commitClear = () => {
        syncManagerRef.current?.broadcastClear();
        setIsPersisted(false);
        setLastSaved(null);
        setSize(0);
        debugLog(debug ?? false, 'Cleared storage:', fullKey);
      };

      const existingRaw = storage.getItem(fullKey);
      const removeResult = isPromiseLike<string | null>(existingRaw)
        ? existingRaw.then((raw) =>
            removeStoredData(typeof raw === 'string' ? raw : null)
          )
        : removeStoredData(typeof existingRaw === 'string' ? existingRaw : null);

      if (isPromiseLike<void>(removeResult)) {
        void removeResult
          .then(() => {
            commitClear();
          })
          .catch((e: unknown) => {
            const error = e instanceof Error ? e : new Error(String(e));
            handleError('UNKNOWN', error.message, error);
          });
        return;
      }

      commitClear();
    } catch (e) /* istanbul ignore next -- @preserve Defensive error handling */ {
      const error = e instanceof Error ? e : new Error(String(e));
      handleError('UNKNOWN', error.message, error);
    }
  }, [storage, fullKey, getPartitionKey, debug, handleError]);

  // Force save immediately
  const forceSave = useCallback(() => {
    saveController.flush();
    saveToStorage(stateRef.current);
  }, [saveController, saveToStorage]);

  // Pause/resume
  const pause = useCallback(() => {
    setIsPaused(true);
    saveController.cancel();
  }, [saveController]);

  const resume = useCallback(() => {
    setIsPaused(false);
  }, []);

  // Undo/redo
  const canUndo = historyEnabled && historyIndex > 0;
  const canRedo = historyEnabled && historyIndex < history.length - 1;

  /* istanbul ignore next -- @preserve Undo callback with guard */
  const undo = useCallback(() => {
    if (!canUndo) return;
    const newIndex = historyIndex - 1;
    setHistoryIndex(newIndex);
    setStateInternal(history[newIndex]);
    syncManagerRef.current?.setLocalData(history[newIndex]);
    saveController.save(history[newIndex]);
  }, [canUndo, historyIndex, history, saveController]);

  /* istanbul ignore next -- @preserve Redo callback with guard */
  const redo = useCallback(() => {
    if (!canRedo) return;
    const newIndex = historyIndex + 1;
    setHistoryIndex(newIndex);
    setStateInternal(history[newIndex]);
    syncManagerRef.current?.setLocalData(history[newIndex]);
    saveController.save(history[newIndex]);
  }, [canRedo, historyIndex, history, saveController]);

  // withClear wrapper
  const withClear = useCallback(
    <R,>(handler: () => R | Promise<R>) =>
      async (): Promise<R> => {
        const result = await handler();
        clear();
        return result;
      },
    [clear]
  );

  // Reset to initial state
  const reset = useCallback(() => {
    setStateInternal(initialStateRef.current);
    setHistory([initialStateRef.current]);
    setHistoryIndex(0);
    clear();
  }, [clear]);

  // Get persisted value without triggering restore
  /* istanbul ignore next -- @preserve getPersistedValue with optional branches */
  const getPersistedValue = useCallback((): T | null => {
    if (isSSR()) return null;

    try {
      const raw = storage.getItem(fullKey);
      if (isPromiseLike<string | null>(raw)) {
        debugLog(
          debug ?? false,
          'getPersistedValue requires a synchronous storage adapter'
        );
        return null;
      }

      if (!raw || typeof raw !== 'string') return null;

      const manifest = parsePartitionManifest(raw);
      let payload = raw;

      if (manifest) {
        let reconstructed = '';
        for (let i = 0; i < manifest.count; i++) {
          const chunk = storage.getItem(getPartitionKey(i));
          if (isPromiseLike<string | null>(chunk) || !chunk || typeof chunk !== 'string') {
            return null;
          }
          reconstructed += chunk;
        }
        payload = reconstructed;
      }

      const parsed = transformer.deserialize(payload);
      if (!parsed || !isValidPersistedData<unknown>(parsed)) return null;
      if (isExpired(parsed)) return null;

      return parsed.data as T;
    } catch {
      /* istanbul ignore next -- @preserve Defensive error handling */
      return null;
    }
  }, [storage, fullKey, getPartitionKey, transformer, debug]);

  // Check if dirty
  const isDirty = useMemo(
    () => !isEqual(state, initialStateRef.current),
    [state]
  );

  // Revert to last saved state
  const revert = useCallback(() => {
    const persisted = getPersistedValue();
    if (persisted) {
      syncManagerRef.current?.setLocalData(persisted);
      setStateInternal(persisted);
    }
  }, [getPersistedValue]);

  // Build actions object
  const actions: FormPersistActions<T> = useMemo(
    () => ({
      clear,
      isPersisted,
      isRestored,
      lastSaved,
      forceSave,
      pause,
      resume,
      isPaused,
      undo,
      redo,
      canUndo,
      canRedo,
      historyIndex,
      historyLength: history.length,
      withClear,
      reset,
      getPersistedValue,
      isDirty,
      size,
      revert,
    }),
    [
      clear,
      isPersisted,
      isRestored,
      lastSaved,
      forceSave,
      pause,
      resume,
      isPaused,
      undo,
      redo,
      canUndo,
      canRedo,
      historyIndex,
      history.length,
      withClear,
      reset,
      getPersistedValue,
      isDirty,
      size,
      revert,
    ]
  );

  return [state, setState, actions];
}

/**
 * Object-based return type version of useFormPersist
 * Useful for selective destructuring
 *
 * @example
 * ```tsx
 * const { state, setState, clear, undo, redo } = useFormPersistObject('myForm', {
 *   name: '',
 * });
 * ```
 */
export function useFormPersistObject<T extends Record<string, unknown>>(
  key: string,
  initialState: T,
  options: FormPersistOptions<T> = {}
) {
  const [state, setState, actions] = useFormPersist(key, initialState, options);

  return {
    state,
    setState,
    ...actions,
  };
}
